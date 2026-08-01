import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Pill, SearchCapsule } from "@/components/ui/pill";
import PartnerChat from "@/components/PartnerChat";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, UserPlus, MessageSquare, Target, Clock, Sparkles,
  GraduationCap, CheckCircle2, X,
} from "lucide-react";

const subjectOptions = ["DSA", "DBMS", "OS", "CN", "OOP", "Web Dev", "ML/AI", "Mathematics", "System Design"];
const semesterOptions = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const initialsFor = (id: string) => {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[hash % 26] + letters[(hash * 7) % 26];
};

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const Partners = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [chatWith, setChatWith] = useState<{ userId: string; label: string } | null>(null);


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
  const clearFilters = () => { setSearchQuery(""); setFilterSubject("all"); setFilterSemester("all"); };

  const handleConnect = (id: string) => {
    setConnected(prev => new Set(prev).add(id));
    toast.success("Connection request sent!");
  };

  const strongMatches = scored.filter(p => p.matchScore >= 80).length;

  const stats = [
    { label: "students listed", value: scored.length },
    { label: "strong matches", value: strongMatches },
    { label: "your subjects", value: myProfile?.subjects?.length ?? 0 },
    { label: "requests sent", value: connected.size },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
      {/* Editorial hero */}
      <motion.div {...fade(0)} className="mb-10 md:mb-14">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-[#8e8e8e]">study partners</span>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          <span className="text-xs text-[#8e8e8e] lowercase">matching</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-[#1a1a1a]">
          find your
          <br />
          <span className="text-[#8e8e8e]">study squad.</span>
        </h1>
        <p className="mt-4 text-[#8e8e8e] text-base md:text-lg max-w-xl">
          match with engineering students who share your subjects, semester and goals.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {myProfile ? (
            <Pill variant="solid" onClick={openForm}><UserPlus className="w-4 h-4" /> edit my profile</Pill>
          ) : (
            <Pill variant="solid" onClick={openForm}><Sparkles className="w-4 h-4" /> create my profile</Pill>
          )}
          {hasActiveFilters && <Pill variant="glass" onClick={clearFilters}><X className="w-4 h-4" /> clear filters</Pill>}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div {...fade(0.1)} className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]/10 rounded-3xl overflow-hidden mb-10 border border-[#1a1a1a]/10">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg-base p-6 md:p-8 hover:bg-white/60 transition-colors">
            <p className="font-display text-4xl md:text-5xl tracking-tight text-[#1a1a1a] leading-none">{s.value}</p>
            <p className="text-xs text-[#8e8e8e] mt-3 lowercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Profile prompt */}
      {!myProfile && !showForm && (
        <motion.div {...fade(0.15)} className="glass rounded-3xl p-6 md:p-8 mb-10 flex items-center gap-5 flex-wrap">
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <h3 className="font-display text-xl text-[#1a1a1a] lowercase">create your partner profile</h3>
            <p className="text-sm text-[#8e8e8e] mt-1">add your subjects and goals so others can find you — and get smarter match suggestions.</p>
          </div>
          <Pill variant="solid" onClick={openForm}>get started →</Pill>
        </motion.div>
      )}

      {/* Profile form */}
      {showForm && (
        <motion.div {...fade(0)} className="glass rounded-3xl p-6 md:p-8 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl text-[#1a1a1a] lowercase">your study profile</h3>
            <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-[#6a6a6a]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-2 block">semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="rounded-full bg-white/70 border-black/5 h-11"><SelectValue placeholder="select semester" /></SelectTrigger>
                <SelectContent>
                  {semesterOptions.map(s => <SelectItem key={s} value={s}>{s} Semester</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-2 block">availability</Label>
              <Input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g., weekday evenings" className="rounded-full bg-white/70 border-black/5 h-11 px-5" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-2 block">subjects</Label>
              <div className="flex flex-wrap gap-2">
                {subjectOptions.map(sub => {
                  const active = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`text-xs px-4 py-2 rounded-full border transition-all lowercase ${
                        active
                          ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                          : "bg-white/60 border-black/10 text-[#6a6a6a] hover:bg-white hover:text-[#1a1a1a]"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-2 block">goals</Label>
              <Input value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g., dsa placement preparation" className="rounded-full bg-white/70 border-black/5 h-11 px-5" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-2 block">about you</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="brief intro about yourself and what you're looking for…" rows={3} className="rounded-2xl bg-white/70 border-black/5" />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Pill variant="solid" onClick={saveProfile} disabled={saving}>{saving ? "saving…" : "save profile"}</Pill>
            <Pill variant="glass" onClick={() => setShowForm(false)}>cancel</Pill>
          </div>
        </motion.div>
      )}

      {/* Search + filters */}
      <motion.div {...fade(0.2)} className="flex flex-col lg:flex-row gap-3 mb-8">
        <SearchCapsule
          className="flex-1 max-w-none"
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="search by goals, bio or subject…"
          onSubmit={(e) => e.preventDefault()}
        />
        <div className="flex gap-2">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full lg:w-44 rounded-full bg-white/70 border-white/60 backdrop-blur-xl h-12 px-5 lowercase">
              <SelectValue placeholder="subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all subjects</SelectItem>
              {subjectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-full lg:w-44 rounded-full bg-white/70 border-white/60 backdrop-blur-xl h-12 px-5 lowercase">
              <SelectValue placeholder="semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all semesters</SelectItem>
              {semesterOptions.map(s => <SelectItem key={s} value={s}>{s} Semester</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div {...fade(0.25)} className="flex items-baseline gap-3 mb-5">
        <h2 className="font-display text-2xl text-[#1a1a1a] lowercase">
          {filteredPartners.length} {filteredPartners.length === 1 ? "partner" : "partners"}
        </h2>
        <span className="h-px flex-1 bg-[#1a1a1a]/10" />
        {myProfile && <span className="text-xs text-[#8e8e8e] lowercase">sorted by match score</span>}
      </motion.div>

      {/* Partner cards */}
      {filteredPartners.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPartners.map((partner, i) => {
            const isConnected = connected.has(partner.id);
            const initials = initialsFor(partner.user_id);
            const online = partner.availability?.toLowerCase().includes("evening") || partner.availability?.toLowerCase().includes("weekend");

            return (
              <motion.div key={partner.id} {...fade(0.3 + i * 0.04)}>
                <div className="glass rounded-3xl p-6 h-full flex flex-col hover:bg-white/80 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-display text-sm">
                        {initials}
                      </div>
                      {online && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand-green border-2 border-white" />}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl leading-none text-[#1a1a1a]">{partner.matchScore}%</p>
                      <p className="text-[10px] text-[#8e8e8e] mt-1 lowercase tracking-wide">match</p>
                    </div>
                  </div>

                  <h3 className="font-display text-xl text-[#1a1a1a] lowercase">student #{initials}</h3>
                  <p className="text-xs text-[#8e8e8e] mt-1 lowercase">
                    {partner.semester ? `${partner.semester} semester` : "semester not set"}
                  </p>
                  {partner.bio && <p className="text-sm text-[#6a6a6a] mt-3 line-clamp-2">{partner.bio}</p>}

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {partner.subjects?.slice(0, 5).map((sub: string) => {
                      const shared = myProfile?.subjects?.includes(sub);
                      return (
                        <span
                          key={sub}
                          className={`text-[11px] px-3 py-1 rounded-full border ${
                            shared ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white/60 border-black/10 text-[#6a6a6a]"
                          }`}
                        >
                          {sub}
                        </span>
                      );
                    })}
                    {(partner.subjects?.length || 0) > 5 && (
                      <span className="text-[11px] px-3 py-1 rounded-full border border-black/10 bg-white/60 text-[#6a6a6a]">
                        +{partner.subjects!.length - 5}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mt-5 mb-6 text-xs text-[#8e8e8e] flex-1">
                    {partner.goals && (
                      <div className="flex items-start gap-2">
                        <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{partner.goals}</span>
                      </div>
                    )}
                    {partner.availability && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{partner.availability}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-[#1a1a1a]/10">
                    <Pill
                      variant={isConnected ? "outline" : "solid"}
                      className="flex-1 justify-center"
                      onClick={() => !isConnected && handleConnect(partner.id)}
                      disabled={isConnected}
                    >
                      {isConnected ? <><CheckCircle2 className="w-4 h-4" /> request sent</> : <><UserPlus className="w-4 h-4" /> connect</>}
                    </Pill>
                    <Pill
                      variant="glass"
                      className="px-3"
                      onClick={() => setChatWith({ userId: partner.user_id, label: `student #${initials}` })}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Pill>

                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div {...fade(0.3)} className="rounded-3xl border border-dashed border-[#1a1a1a]/15 p-16 text-center">
          <Users className="w-10 h-10 text-[#1a1a1a]/15 mx-auto mb-4" />
          <p className="font-display text-2xl text-[#1a1a1a] lowercase">no study partners found</p>
          <p className="text-sm text-[#8e8e8e] mt-2">
            {hasActiveFilters ? "try adjusting your filters." : "be the first to create a profile!"}
          </p>
          {hasActiveFilters && (
            <div className="mt-6 flex justify-center">
              <Pill variant="glass" onClick={clearFilters}>clear filters</Pill>
            </div>
          )}
        </motion.div>
      )}

      {chatWith && (
        <PartnerChat
          open={!!chatWith}
          partnerUserId={chatWith.userId}
          partnerLabel={chatWith.label}
          onClose={() => setChatWith(null)}
        />
      )}
    </div>

  );
};

export default Partners;
