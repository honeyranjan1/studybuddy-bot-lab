import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Clock, AlertTriangle } from "lucide-react";

const ExamCountdown = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examSubject, setExamSubject] = useState("");

  const { data: countdowns } = useQuery({
    queryKey: ["examCountdowns", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("exam_countdowns").select("*").eq("user_id", user!.id).eq("is_active", true).order("exam_date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const addCountdown = async () => {
    if (!examName.trim() || !examDate) {
      toast.error("Please enter exam name and date");
      return;
    }
    if (!user) return;

    await supabase.from("exam_countdowns").insert({
      user_id: user.id,
      exam_name: examName.trim(),
      exam_date: examDate,
      subject: examSubject.trim() || null,
    });

    queryClient.invalidateQueries({ queryKey: ["examCountdowns", user.id] });
    toast.success("Exam countdown added!");
    setExamName("");
    setExamDate("");
    setExamSubject("");
    setShowAdd(false);
  };

  const deleteCountdown = async (id: string) => {
    await supabase.from("exam_countdowns").update({ is_active: false }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["examCountdowns", user?.id] });
    toast.success("Countdown removed");
  };

  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">📅 Exam Countdown</h1>
          <p className="text-muted-foreground">Track days remaining until your exams</p>
        </motion.div>

        <div className="flex justify-end mb-4">
          <Button variant="hero" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4 mr-2" /> Add Exam
          </Button>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Exam Name</Label>
                  <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g., Mid-Semester, GATE..." />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Date</Label>
                  <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Subject (optional)</Label>
                  <Input value={examSubject} onChange={e => setExamSubject(e.target.value)} placeholder="e.g., DBMS" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="hero" onClick={addCountdown}>Save</Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="space-y-4">
          {countdowns && countdowns.length > 0 ? (
            countdowns.map((exam, i) => {
              const days = getDaysRemaining(exam.exam_date);
              const urgent = days <= 7;
              const passed = days < 0;

              return (
                <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`p-5 ${urgent && !passed ? "border-accent" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${passed ? "bg-muted" : urgent ? "gradient-accent" : "gradient-hero"}`}>
                          <span className="text-lg font-display font-bold text-primary-foreground">
                            {passed ? "✓" : Math.abs(days)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{exam.exam_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(exam.exam_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {exam.subject && <> • {exam.subject}</>}
                          </div>
                          {urgent && !passed && (
                            <div className="flex items-center gap-1 text-xs text-accent mt-1">
                              <AlertTriangle className="w-3 h-3" /> {days === 0 ? "Today!" : `${days} day${days !== 1 ? "s" : ""} left!`}
                            </div>
                          )}
                          {passed && <p className="text-xs text-muted-foreground mt-1">Exam completed</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteCountdown(exam.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No exam countdowns yet. Add your upcoming exams!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamCountdown;
