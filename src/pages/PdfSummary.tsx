import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { FileText, Upload, Loader2, Sparkles, X } from "lucide-react";

const PdfSummary = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(f);
    setSummary("");
  };

  const processPdf = async () => {
    if (!file) return;
    setProcessing(true);
    setSummary("");

    try {
      // Read file as text (basic extraction)
      const text = await file.text();
      // For actual PDF parsing, we'll send the content to AI
      const truncated = text.slice(0, 8000); // Limit for API

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `I've uploaded a PDF document. Here is the extracted text content. Please provide:

1. **📋 Summary** — A concise summary of the document (3-5 paragraphs)
2. **🔑 Key Points** — The most important takeaways (bullet points)
3. **📝 Flashcard Questions** — 5 flashcard-style Q&A pairs based on the content
4. **🎯 Important Terms** — Key terminology with brief definitions

Document content:
${truncated}

If the content appears garbled (common with PDF text extraction), do your best to interpret what you can and mention any issues.`,
            },
          ],
          type: "pdf-summary",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to process PDF");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setSummary(content);
            }
          } catch {}
        }
      }

      toast.success("PDF processed successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to process PDF");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">📄 PDF Summary Tool</h1>
          <p className="text-muted-foreground">Upload a PDF — get summaries, key points, and flashcards</p>
        </motion.div>

        <Card className="p-6 mb-6">
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />

          {!file ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">Click to upload PDF</p>
              <p className="text-sm text-muted-foreground">Max 10MB • PDF files only</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setSummary(""); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {file && (
            <Button onClick={processPdf} disabled={processing} variant="hero" className="w-full mt-4">
              {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Summarize PDF</>}
            </Button>
          )}
        </Card>

        {summary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground">AI Summary</h2>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PdfSummary;
