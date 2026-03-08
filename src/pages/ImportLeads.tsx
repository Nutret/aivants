import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ParsedLead {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  title: string;
  source: string;
  website: string;
  linkedin: string;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ""));
  return result;
}

function parseCSV(text: string): ParsedLead[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/['"]/g, "").trim());

  const colMap: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    full_name: ["full name", "full_name", "name", "contact name", "contact"],
    first_name: ["first_name", "firstname", "first name", "fname"],
    last_name: ["last_name", "lastname", "last name", "lname"],
    email: ["email", "email_address", "e-mail", "mail"],
    phone: ["phone", "phone_number", "telephone", "tel", "mobile"],
    company_name: ["company_name", "company", "organization", "org", "company name"],
    title: ["title", "job_title", "position", "role", "job title"],
    source: ["source", "lead_source", "origin", "lead source"],
    website: ["website", "url", "web", "site", "domain"],
    linkedin: ["linkedin", "linkedin_url", "linkedin url", "linkedin profile"],
  };

  headers.forEach((h, i) => {
    for (const [field, names] of Object.entries(aliases)) {
      if (names.includes(h) && !(field in colMap)) {
        colMap[field] = i;
        break;
      }
    }
  });

  const getVal = (cols: string[], field: string) => {
    const idx = colMap[field];
    if (idx === undefined) return "";
    return (cols[idx] || "").trim();
  };

  const results: ParsedLead[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);

    // Handle "Full Name" → split into first/last
    let firstName = getVal(cols, "first_name");
    let lastName = getVal(cols, "last_name");
    if (!firstName && colMap.full_name !== undefined) {
      const fullName = getVal(cols, "full_name");
      const parts = fullName.split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ");
    }

    const email = getVal(cols, "email");
    if (!email || !firstName) continue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

    results.push({
      first_name: firstName.slice(0, 100),
      last_name: lastName.slice(0, 100),
      email: email.slice(0, 255).toLowerCase(),
      phone: getVal(cols, "phone").slice(0, 50),
      company_name: getVal(cols, "company_name").slice(0, 200),
      title: getVal(cols, "title").slice(0, 200),
      source: getVal(cols, "source").slice(0, 100) || "csv_import",
      website: getVal(cols, "website").slice(0, 500),
      linkedin: getVal(cols, "linkedin").slice(0, 500),
    });
  }

  return results;
}

export default function ImportLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleImport = async () => {
    if (!file || !user) return;
    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        toast({ title: "No valid leads found", description: "Check your CSV format and ensure it has first_name and email columns.", variant: "destructive" });
        setImporting(false);
        return;
      }

      // Get existing emails to detect duplicates
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("email")
        .eq("user_id", user.id);

      const existingEmails = new Set((existingLeads || []).map((l) => l.email.toLowerCase()));

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      // Separate new from duplicates
      const newLeads = parsed.filter((lead) => {
        if (existingEmails.has(lead.email)) {
          skipped++;
          return false;
        }
        existingEmails.add(lead.email); // Prevent intra-batch duplicates
        return true;
      });

      setProgress(20);

      // Insert in batches of 50
      const batchSize = 50;
      for (let i = 0; i < newLeads.length; i += batchSize) {
        const batch = newLeads.slice(i, i + batchSize).map((lead) => ({
          user_id: user.id,
          first_name: lead.first_name,
          last_name: lead.last_name || null,
          email: lead.email,
          phone: lead.phone || null,
          company_name: lead.company_name || null,
          title: lead.title || null,
          source: lead.source || "csv_import",
          website: lead.website || null,
          linkedin: lead.linkedin || null,
          status: "new" as const,
        }));

        const { error, data } = await supabase.from("leads").insert(batch).select("id");

        if (error) {
          errors += batch.length;
        } else {
          imported += (data || []).length;

          // Create pipeline entries for newly imported leads
          const pipelineEntries = (data || []).map((lead) => ({
            user_id: user.id,
            lead_id: lead.id,
            stage: "New Lead",
          }));
          await supabase.from("pipeline_stages").insert(pipelineEntries);
        }

        setProgress(20 + Math.round(((i + batchSize) / newLeads.length) * 80));
      }

      setProgress(100);
      setResult({ imported, skipped, errors });
      toast({ title: "Import complete", description: `${imported} leads imported successfully.` });
    } catch (err) {
      toast({ title: "Import failed", description: "Could not parse the CSV file.", variant: "destructive" });
    }

    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Leads</h1>
        <p className="text-muted-foreground">Upload a CSV file to import leads</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Supported format: CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Drag & drop your CSV here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="file-upload" />
            <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              Browse Files
            </Button>
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border p-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Importing..." : "Start Import"}
              </Button>
            </div>
          )}

          {importing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing leads...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <div className="text-2xl font-bold">{result.imported}</div>
                  <div className="text-sm text-muted-foreground">Imported</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <div className="text-2xl font-bold">{result.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped (duplicates)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-2xl font-bold">{result.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="block rounded-lg bg-muted p-4 text-sm font-mono">
            first_name, last_name, email, phone, company_name, title, source
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Required columns: <strong>first_name</strong> and <strong>email</strong>. All other columns are optional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
