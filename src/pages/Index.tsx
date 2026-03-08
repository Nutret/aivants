import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, FolderKanban, FileText, IndianRupee, Settings, ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  {
    title: "Lead Management",
    description: "Organize leads by industry, manage sheets, import & track prospects",
    icon: Users,
    path: "/leads",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/15 text-primary",
  },
  {
    title: "Client Management",
    description: "Manage active clients, contracts, and communications",
    icon: Briefcase,
    path: "/clients",
    gradient: "from-accent/20 to-accent/5",
    iconBg: "bg-accent/15 text-accent",
  },
  {
    title: "Client Project Management",
    description: "Track projects, assign teams, manage deadlines & milestones",
    icon: FolderKanban,
    path: "/projects",
    gradient: "from-warning/20 to-warning/5",
    iconBg: "bg-warning/15 text-warning",
  },
  {
    title: "Proposal Management",
    description: "Create, store, and share proposals with clients instantly",
    icon: FileText,
    path: "/proposals",
    gradient: "from-chart-4/20 to-chart-4/5",
    iconBg: "bg-[hsl(280,65%,55%)]/15 text-[hsl(280,65%,55%)]",
  },
  {
    title: "Revenue Dashboard",
    description: "Financial overview — revenue, costs, profit & growth projections",
    icon: IndianRupee,
    path: "/revenue",
    gradient: "from-success/20 to-success/5",
    iconBg: "bg-success/15 text-success",
  },
  {
    title: "General System",
    description: "Campaigns, templates, sequences, follow-ups, pipeline & settings",
    icon: Settings,
    path: "/campaigns",
    gradient: "from-muted-foreground/10 to-muted/5",
    iconBg: "bg-muted text-muted-foreground",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Aivants Command Center
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome back, {firstName}. Where do you want to go?
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {sections.map((section) => (
          <motion.div
            key={section.title}
            variants={item}
            onClick={() => navigate(section.path)}
            className={`group relative cursor-pointer rounded-xl border bg-gradient-to-br ${section.gradient} p-6 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/30`}
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-3 ${section.iconBg}`}>
                <section.icon className="h-6 w-6" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-4 space-y-1">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
