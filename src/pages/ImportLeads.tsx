import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function ImportLeads() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".xlsx"))) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setProgress(0);
    // Simulate import
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 100));
      setProgress(i);
    }
    setResult({ imported: 1247, skipped: 23, errors: 5 });
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Leads</h1>
        <p className="text-muted-foreground">Upload CSV or Excel files to import leads</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Supported formats: CSV, Excel (.xlsx)</CardDescription>
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
            <p className="text-lg font-medium">Drag & drop your file here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              Browse Files
            </Button>
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border p-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
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
            first_name, last_name, company_name, email, phone, industry, location, website
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
