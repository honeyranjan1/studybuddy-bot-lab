import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, UserPlus, Search, MessageSquare, Target, Clock, Sparkles,
  GraduationCap, CheckCircle2, Filter, X,
} from "lucide-react";

const subjectOptions = ["DSA", "DBMS", "OS", "CN", "OOP", "Web Dev", "ML/AI", "Mathematics", "System Design"];
const semesterOptions = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const avatarPalette = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-red-500",
  "from-cyan-500 to-blue-500",
];

const initialsFor = (id: string) => {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[hash % 26] + letters[(hash * 7) % 26];
};
const colorFor = (id: string) => {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return avatarPalette[hash % avatarPalette.length];
};

const Partners = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");
  const [connected, setConnected] = useState<Set<string>>(new Set());

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
      const { data } = await supabase.from("study_partners").select("*").eq("user_id", user!.id).maybeSingle();
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

  const openForm = () => {
    if (myProfile) {
      setSemester(myProfile.semester || "");
      setSelectedSubjects(myProfile.subjects || []);
      setGoals(myProfile.goals || "");
      setAvailability(myProfile.availability || "");
      setBio(myProfile.bio || "");
    }
    setShowForm(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    if (selectedSubjects.length === 0) { toast.error("Select at least one subject"); return; }
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
      if (myProfile) await supabase.from("study_partners").update(payload).eq("user_id", user.id);
      else await supabase.from("study_partners").insert(payload);

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

  // Match score: subject overlap + semester match
  const scored = useMemo(() => {
    if (!partners) return [];
    const mySubs = new Set(myProfile?.subjects || []);
    const mySem = myProfile?.semester;
    return partners.map(p => {
      const overlap = (p.subjects || []).filter(s => mySubs.has(s)).length;
      const subjectScore = mySubs.size > 0 ? (overlap / Math.max(mySubs.size, 1)) * 70 : 0;
      const semScore = mySem && p.semester === mySem ? 30 : (mySem ? 10 : 15);
      const base = mySubs.size === 0 ? 50 + ((p.subjects?.length || 0) * 5) : subjectScore + semScore;
      return { ...p, matchScore: Math.min(99, Math.round(base)) };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [partners, myProfile]);

  const filteredPartners = scored.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.goals?.toLowerCase().includes(q) || p.bio?.toLowerCase().includes(q) || p.subjects?.some(s => s.toLowerCase().includes(q));
    const matchesSubject = filterSubject === "all" || p.subjects?.includes(filterSubject);
    const matchesSemester = filterSemester === "all" || p.semester === filterSemester;
    return matchesSearch && matchesSubject && matchesSemester;
  });

  const hasActiveFilters = searchQuery || filterSubject !== "all" || filterSemester !== "all";

  const handleConnect = (id: string) => {
    setConnected(prev => new Set(prev).add(id));
    toast.success("Connection request sent!");
  };

  const matchTone = (s: number) =>
    s >= 80 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : s >= 50 ? "bg-primary/15 text-primary"
    : "bg-muted text-muted-foreground";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
            <Users className="w-3.5 h-3.5" /> Study Partner Matching
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Find your study squad</h1>
          <p className="text-sm text-muted-foreground mt-1">Match with engineering students who share your subjects, semester, and goals.</p>
        </div>
        {myProfile ? (
          <Button variant="outline" onClick={openForm}>
            <UserPlus className="w-4 h-4" /> Edit My Profile
          </Button>
        ) : (
          <Button variant="hero" onClick={openForm}>
            <Sparkles className="w-4 h-4" /> Create My Profile
          </Button>
        )}
      </motion.div>

      {/* No profile prompt */}
      {!myProfile && !showForm && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-display font-semibold text-foreground">Create your partner profile</h3>
                <p className="text-sm text-muted-foreground">Add your subjects and goals so others can find you — and get smarter match suggestions.</p>
              </div>
              <Button variant="hero" onClick={openForm}>Get started</Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Profile Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 border-border/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg text-foreground">Your study profile</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
                <Label className="text-sm font-medium mb-2 block">Availability</Label>
                <Input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g., Weekday evenings" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium mb-2 block">Subjects (select multiple)</Label>
                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map(sub => {
                    const active = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium mb-2 block">Goals</Label>
                <Input value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g., DSA placement preparation" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium mb-2 block">About you</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief intro about yourself and what you're looking for..." rows={3} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="hero" onClick={saveProfile} disabled={saving} className="flex-1 sm:flex-none">
                {saving ? "Saving..." : "Save profile"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <Card className="p-3 border-border/60">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by goals, bio, or subject..."
              className="pl-10 border-transparent bg-secondary/60 focus-visible:bg-card focus-visible:border-border"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full lg:w-44">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger className="w-full lg:w-44">
                <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {semesterOptions.map(s => <SelectItem key={s} value={s}>{s} Semester</SelectItem>)}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={() => { setSearchQuery(""); setFilterSubject("all"); setFilterSemester("all"); }} title="Clear filters">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredPartners.length}</span> {filteredPartners.length === 1 ? "partner" : "partners"} found
        </p>
        {myProfile && <span className="text-xs text-muted-foreground hidden sm:inline">Sorted by match score</span>}
      </div>

      {/* Partner Cards */}
      {filteredPartners.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredPartners.map((partner, i) => {
            const isConnected = connected.has(partner.id);
            const initials = initialsFor(partner.user_id);
            const gradient = colorFor(partner.user_id);
            const availabilityOnline = partner.availability?.toLowerCase().includes("evening") || partner.availability?.toLowerCase().includes("weekend");

            return (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="p-5 h-full border-border/60 hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      <Avatar className={`w-12 h-12 bg-gradient-to-br ${gradient}`}>
                        <AvatarFallback className="bg-transparent text-white font-semibold text-sm">{initials}</AvatarFallback>
                      </Avatar>
                      {availabilityOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-semibold text-foreground truncate">Student #{initials}</h3>
                        {partner.semester && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                            <GraduationCap className="w-3 h-3 mr-0.5" />{partner.semester} Sem
                          </Badge>
                        )}
                      </div>
                      {partner.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{partner.bio}</p>}
                    </div>
                    <div className={`shrink-0 px-2 py-1 rounded-lg text-xs font-semibold ${matchTone(partner.matchScore)}`}>
                      {partner.matchScore}%
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {partner.subjects?.slice(0, 5).map((sub: string) => {
                      const isShared = myProfile?.subjects?.includes(sub);
                      return (
                        <Badge
                          key={sub}
                          variant="outline"
                          className={`text-[10px] h-5 px-1.5 ${isShared ? "border-primary/40 bg-primary/10 text-primary" : ""}`}
                        >
                          {sub}
                        </Badge>
                      );
                    })}
                    {(partner.subjects?.length || 0) > 5 && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">+{partner.subjects!.length - 5}</Badge>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5 mb-4 text-xs text-muted-foreground flex-1">
                    {partner.goals && (
                      <div className="flex items-start gap-1.5">
                        <Target className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
                        <span className="line-clamp-1">{partner.goals}</span>
                      </div>
                    )}
                    {partner.availability && (
                      <div className="flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
                        <span className="line-clamp-1">{partner.availability}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-border/60">
                    <Button
                      variant={isConnected ? "outline" : "hero"}
                      size="sm"
                      className="flex-1"
                      onClick={() => !isConnected && handleConnect(partner.id)}
                      disabled={isConnected}
                    >
                      {isConnected ? (
                        <><CheckCircle2 className="w-4 h-4" /> Request sent</>
                      ) : (
                        <><UserPlus className="w-4 h-4" /> Connect</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Messaging coming soon")}>
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 border-dashed border-border/60 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-display font-medium text-foreground">No study partners found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters ? "Try adjusting your filters." : "Be the first to create a profile!"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearchQuery(""); setFilterSubject("all"); setFilterSemester("all"); }}>
              Clear filters
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default Partners;
