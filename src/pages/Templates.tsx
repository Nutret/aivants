import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Copy, Trash2, Variable } from "lucide-react";

const variables = ["{first_name}", "{last_name}", "{company_name}", "{industry}", "{location}"];

const mockTemplates = [
  {
    id: "1",
    name: "Cold Outreach - General",
    subject: "Quick question about {company_name}",
    body: `Hi {first_name},\n\nI came across {company_name} and noticed your work in {industry}.\n\nWe help companies automate lead generation and increase inbound client acquisition.\n\nWould you be open to a quick conversation this week?\n\nBest regards`,
  },
  {
    id: "2",
    name: "Follow Up",
    subject: "Following up - {company_name}",
    body: `Hi {first_name},\n\nI wanted to follow up on my previous email about how we can help {company_name} grow.\n\nOur clients in {industry} typically see a 3x increase in qualified leads within 60 days.\n\nWould a 15-minute call work for you?`,
  },
];

export default function Templates() {
  const [showEditor, setShowEditor] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  const insertVariable = (v: string) => {
    setEditBody((prev) => prev + v);
  };

  const previewBody = editBody
    .replace("{first_name}", "John")
    .replace("{last_name}", "Smith")
    .replace("{company_name}", "Alpha Realty")
    .replace("{industry}", "Real Estate")
    .replace("{location}", "New York");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">Create reusable email templates with variables</p>
        </div>
        <Button onClick={() => setShowEditor(!showEditor)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {showEditor && (
        <Card>
          <CardHeader>
            <CardTitle>Template Editor</CardTitle>
            <CardDescription>Use variables like {"{first_name}"} to personalize emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Template name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              placeholder="Email subject"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <Button key={v} variant="outline" size="sm" onClick={() => insertVariable(v)}>
                  <Variable className="h-3 w-3 mr-1" />
                  {v}
                </Button>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Template Body</label>
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Write your email template..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Preview</label>
                <div className="min-h-[200px] rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                  {previewBody || "Start typing to see preview..."}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Save Template</Button>
              <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {mockTemplates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    Subject: <span className="font-mono">{template.subject}</span>
                  </div>
                  <div className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground line-clamp-3">
                    {template.body}
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
