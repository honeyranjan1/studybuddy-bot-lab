import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, UserPlus, Search, MessageSquare, BookOpen, Target } from "lucide-react";

const subjectOptions = ["DSA", "DBMS", "OS", "CN", "OOP", "Web Dev", "ML/AI", "Mathematics", "System Design"];
const semesterOptions = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const Partners = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Form state
  const [semester, setSemester] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [availability, setAvailability] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: myProfile } = useQuery({
    queryKey: ["myPartnerProfile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("study_partners").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: partners } = useQuery({
    queryKey: ["studyPartners"],
    queryFn: async () => {
      const { data } = await supabase.from("study_partners").select("*").eq("is_visible", true).neq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  };

  const saveProfile = async () => {
    if (!user) return;
    if (selectedSubjects.length === 0) {
      toast.error("Select at least one subject");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        semester,
        subjects: selectedSubjects,
        goals: goals.trim(),
        availability: availability.trim(),
        bio: bio.trim(),
        is_visible: true,
      };

      if (myProfile) {
        await supabase.from("study_partners").update(payload).eq("user_id", user.id);
      } else {
        await supabase.from("study_partners").insert(payload);
      }

      queryClient.invalidateQueries({ queryKey: ["myPartnerProfile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["studyPartners"] });
      toast.success("Profile saved!");
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const filteredPartners = partners?.filter(p => {
    const matchesSearch = !searchQuery || p.goals?.toLowerCase().includes(searchQuery.toLowerCase()) || p.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !filterSubject || p.subjects?.includes(filterSubject);
    return matchesSearch && matchesSubject;
  }) || [];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">🤝 Find Study Partners</h1>
          <p className="text-muted-foreground">Connect with students who share your goals and subjects</p>
        </motion.div>

        {/* My Profile Status */}
        {!myProfile && !showForm && (
          <Card className="p-6 mb-6 text-center gradient-hero text-primary-foreground">
            <UserPlus className="w-10 h-10 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg mb-2">Create Your Partner Profile</h3>
            <p className="text-sm opacity-80 mb-4">Let other students find and connect with you</p>
            <Button variant="accent" onClick={() => setShowForm(true)}>Create Profile</Button>
          </Card>
        )}

        {/* Profile Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 mb-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">Your Study Profile</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                    <SelectContent>
                      {semesterOptions.map(s => <SelectItem key={s} value={s}>{s} Semester</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Subjects (select multiple)</Label>
                  <div className="flex flex-wrap gap-2">
                    {subjectOptions.map(sub => (
                      <Badge
                        key={sub}
                        variant={selectedSubjects.includes(sub) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSubject(sub)}
                      >
                        {sub}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Goals</Label>
                  <Input value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g., DSA placement preparation, competitive coding..." />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Availability</Label>
                  <Input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g., Weekday evenings, Weekend mornings..." />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">About You</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief intro about yourself and what you're looking for..." rows={3} />
                </div>

                <div className="flex gap-3">
                  <Button variant="hero" onClick={saveProfile} disabled={saving} className="flex-1">
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by goals, bio..." className="pl-10" />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Partner Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredPartners.length > 0 ? (
            filteredPartners.map((partner, i) => (
              <motion.div key={partner.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 hover:shadow-card transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-semibold text-foreground">Student</h3>
                        {partner.semester && <Badge variant="secondary" className="text-xs">{partner.semester} Sem</Badge>}
                      </div>
                      {partner.bio && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{partner.bio}</p>}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {partner.subjects?.map((sub: string) => (
                          <Badge key={sub} variant="outline" className="text-xs">{sub}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {partner.goals && (
                          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {partner.goals}</span>
                        )}
                        {partner.availability && (
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {partner.availability}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No study partners found. Be the first to create a profile!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Partners;
