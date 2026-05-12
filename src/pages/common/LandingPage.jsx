import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Box,
  useMantineTheme,
  SimpleGrid,
  Paper,
  Stack,
  ThemeIcon,
} from "@mantine/core";
import {
  ArrowRight,
  ShieldCheck,
  Leaf,
  TrendingUp,
  Users,
  Truck,
  FlaskConical,
  UserPlus,
  Milk,
  Cpu,
  Smartphone,
  Eye,
  Thermometer,
  Fingerprint,
  ShoppingBag,
  ChevronRight,
  Star
} from "lucide-react";
import ROUTES from "../../utils/routes/routes";
import PublicNavbar from "../../components/common/PublicNavbar";
import PublicFooter from "../../components/common/PublicFooter";

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState(0);

  const stats = [
    { label: "Partner Farmers", value: "1,200+", icon: <Users size={24} /> },
    { label: "Daily Collection", value: "45k+ Liters", icon: <Milk size={24} /> },
    { label: "Fleet Tracking", value: "350+ Units", icon: <Cpu size={24} /> },
    { label: "Total Reach", value: "85+ Agents", icon: <Truck size={24} /> },
  ];

  const supplyChain = [
    { num: "01", title: "Smart Collection", desc: "Digital grade validation at source.", icon: <Milk />, color: "#769642" },
    { num: "02", title: "Lab Validation", desc: "Automated compliance checks.", icon: <FlaskConical />, color: "#07213C" },
    { num: "03", title: "Cold Logistics", desc: "GPS temperature monitoring.", icon: <Truck />, color: "#769642" },
    { num: "04", title: "Safe Processing", desc: "Automated production lines.", icon: <Cpu />, color: "#07213C" },
    { num: "05", title: "Last Mile", desc: "Real-time agent delivery.", icon: <ShoppingBag />, color: "#769642" },
  ];

  const roleTabs = [
    {
      title: "Executive Terminal",
      subtitle: "Operational overview for management",
      icon: Users,
      color: "#07213C",
      features: ["Universal Growth Analytics", "System Administration", "Oversight Control", "Financial Intelligence"],
    },
    {
      title: "Quality Guardian",
      subtitle: "Ensuring standard purity",
      icon: FlaskConical,
      color: "#769642",
      features: ["Real-time Lab Testing", "Reject Handling", "Batch Tracking", "Sanitation Logs"],
    },
    {
      title: "Field Logistics",
      subtitle: "Distribution tracking",
      icon: Truck,
      color: "#6E553E",
      features: ["Live Routing", "Cold-Chain Vault", "Fuel Analytics", "Dispatch Queue"],
    },
    {
      title: "Producer Hub",
      subtitle: "Empowering network farmers",
      icon: UserPlus,
      color: "#204A2A",
      features: ["Ledger Receipts", "Live Leaderboards", "Instant Statements", "Daily Yield Log"],
    },
  ];

  const features = [
    {
      icon: <Thermometer size={32} />,
      title: "Thermal Precision",
      description: "Continuous IoT temperature tracking across transits ensuring your dairy never breaks the cold-chain protocol.",
    },
    {
      icon: <Fingerprint size={32} />,
      title: "End-to-End Trust",
      description: "Zero-knowledge security framework guaranteeing safe access vectors for every administrator and operative.",
    },
    {
      icon: <Smartphone size={32} />,
      title: "Mobile Continuum",
      description: "Advanced field native interfaces designed specifically for poor connectivity environments and offline workflows.",
    },
  ];

  return (
    <Box className="min-h-screen bg-[#FAFAFA] font-outfit overflow-x-hidden selection:bg-[#769642] selection:text-white">
      <PublicNavbar />

      {/* ─── HERO SECTION ─── */}
      <Box className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Visual Background Blend */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105 brightness-75"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#07213C]/95 via-[#07213C]/80 to-[#204A2A]/70 backdrop-blur-[2px]" />

        {/* Ambient Light Circles */}
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-[#769642]/20 rounded-full blur-[120px] z-0" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-[#07213C]/40 rounded-full blur-[120px] z-0" />

        <Container size="lg" className="relative z-10 px-6 py-16 sm:py-20 flex flex-col items-center text-center mt-12">
          
          {/* Upper Badge */}
          <Box className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-xs mb-6 tracking-wider animate-fadeInUp">
            <Star size={14} className="text-[#769642] fill-[#769642]" />
            <span className="uppercase">Next-Gen Dairy Ecosystem</span>
          </Box>

          {/* Dramatic Typography */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight animate-fadeInUp drop-shadow-sm">
            Redefining Dairy <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A6C573] to-[#E1F3C2]">Supply Chains</span>
          </h1>

          {/* Controlled Text */}
          <Text className="!text-white text-sm md:text-base max-w-xl mx-auto mb-12 font-medium leading-relaxed animate-fadeInUp px-4 opacity-90">
            Amizhdhu harmonizes production, intelligent logistics, and 360° processing oversight into a singular, flawless intelligence grid.
          </Text>

          {/* Premium Action Container */}
          <Group justify="center" gap="md" className="animate-fadeInUp w-full max-w-lg mx-auto flex-col sm:flex-row mt-4">
            <Button
              size="md"
              radius="xl"
              style={{ backgroundColor: '#769642' }}
              className="h-11 md:h-12 px-6 md:px-8 hover:bg-[#5f7a35] text-white shadow-xl shadow-[#769642]/20 transition-transform hover:scale-[1.02] border-none w-full sm:w-auto text-sm font-bold"
              rightSection={<ChevronRight size={18} />}
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Access Console
            </Button>
            
            <Button
              size="md"
              variant="outline"
              radius="xl"
              className="h-11 md:h-12 px-6 md:px-8 border-white/40 bg-white/5 backdrop-blur-sm !text-white hover:bg-white/10 transition-all w-full sm:w-auto text-sm font-bold"
              onClick={() => document.getElementById('features-grid')?.scrollIntoView({behavior:'smooth'})}
            >
              Our Framework
            </Button>
          </Group>
        </Container>

        {/* Elegant Bottom Curve */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FAFAFA] to-transparent z-10" />
      </Box>

      {/* ─── METRICS STRIP ─── */}
      <Box className="relative z-20 -mt-12 mb-16 px-4">
        <Container size="lg">
          <Paper radius="2xl" className="p-1 bg-gradient-to-r from-[#07213C]/5 via-white/80 to-[#07213C]/5 backdrop-blur shadow-2xl">
            <div className="bg-white rounded-[20px] py-10 px-6 md:px-12 border border-gray-100">
              <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="xl" className="divide-x-0 md:divide-x divide-gray-100">
                {stats.map((stat, i) => (
                  <div key={i} className="flex flex-col items-center text-center px-4 group transition-all">
                    <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-2xl bg-[#07213C]/5 text-[#07213C] transition-transform group-hover:scale-110">
                      {stat.icon}
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-[#07213C] tracking-tighter">{stat.value}</h3>
                    <span className="text-sm font-bold text-[#769642] uppercase tracking-widest mt-1">{stat.label}</span>
                  </div>
                ))}
              </SimpleGrid>
            </div>
          </Paper>
        </Container>
      </Box>

      {/* ─── LOGISTICS PIPELINE ─── */}
      <Box className="py-24 bg-[#FAFAFA]">
        <Container size="lg" px="md">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <div className="text-[#769642] font-bold tracking-widest text-sm uppercase mb-3 flex items-center justify-center gap-2">
              <span className="w-8 h-[2px] bg-[#769642]" /> Lifecycle Workflow
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#07213C] leading-tight mb-6">
              Precision from Origin to Consumption
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              A tightly integrated supply vector powered by real-time validation layers.
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Background Connector Line for Desktop */}
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-dashed bg-gray-200 z-0" />

            {supplyChain.map((step, i) => (
              <div key={i} className="relative z-10 group flex flex-col items-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all duration-500 group-hover:-translate-y-2"
                  style={{ backgroundColor: step.color, color: 'white' }}
                >
                  {React.cloneElement(step.icon, { size: 32 })}
                  
                  <div className="absolute -bottom-2 w-7 h-7 bg-[#FAFAFA] rounded-full flex items-center justify-center p-0.5">
                    <div className="w-full h-full bg-[#07213C] text-white rounded-full flex items-center justify-center text-[10px] font-black">
                      {step.num}
                    </div>
                  </div>
                </div>
                <h4 className="text-[#07213C] font-extrabold text-center mt-6 mb-2 text-lg">{step.title}</h4>
                <p className="text-gray-500 text-sm text-center font-medium leading-relaxed px-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Box>

      {/* ─── SPECIALIZED PANELS SECTION ─── */}
      <Box id="role-tabs" className="py-24 bg-[#F4F6F7] border-y border-gray-200/50">
        <Container size="xl" px="lg">
          <div className="flex flex-col lg:flex-row items-stretch gap-12">
            
            {/* Left Sidebar Info */}
            <div className="lg:w-1/3 flex flex-col justify-center">
              <div className="text-[#769642] font-bold uppercase tracking-widest text-sm mb-4">
                Tailored Operating Suites
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#07213C] leading-tight mb-6">
                Interfaces by <br/><span className="text-[#769642]">Designation</span>
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Unlike rigid dashboards, our adaptive node architecture customizes layouts purely around tactical objectives.
              </p>

              <Stack gap="md">
                {roleTabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-4 p-5 rounded-2xl text-left border transition-all duration-300 ${
                      activeTab === i 
                      ? "bg-white border-white shadow-xl scale-[1.03]" 
                      : "bg-transparent border-transparent hover:bg-gray-200/50"
                    }`}
                  >
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        activeTab === i ? "text-white" : "bg-white shadow-sm text-gray-400"
                      }`}
                      style={{ backgroundColor: activeTab === i ? tab.color : '' }}
                    >
                      <tab.icon size={22} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-base ${activeTab === i ? "text-[#07213C]" : "text-gray-500"}`}>{tab.title}</div>
                      <div className="text-xs text-gray-400 font-medium tracking-wide">{tab.subtitle}</div>
                    </div>
                    <ChevronRight size={18} className={`transition-opacity ${activeTab === i ? "opacity-100 text-[#769642]" : "opacity-0"}`} />
                  </button>
                ))}
              </Stack>
            </div>

            {/* Right Rich Visualization */}
            <div className="lg:w-2/3">
              <Paper 
                radius="3xl" 
                className="h-full min-h-[450px] overflow-hidden shadow-2xl transition-all duration-500 relative flex flex-col text-white"
                style={{ backgroundColor: roleTabs[activeTab].color }}
              >
                {/* Large Background Icon Shape */}
                <div className="absolute right-[-50px] top-[-20px] opacity-[0.04] scale-[3.5]">
                  {React.createElement(roleTabs[activeTab].icon, { size: 200 })}
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-center p-10 md:p-16">
                  <ThemeIcon variant="white" size={64} radius="xl" className="mb-8 shadow-lg text-[#07213C]">
                    {React.createElement(roleTabs[activeTab].icon, { size: 30 })}
                  </ThemeIcon>

                  <h3 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{roleTabs[activeTab].title}</h3>
                  <p className="text-xl opacity-80 mb-10 max-w-lg font-medium">{roleTabs[activeTab].subtitle} functionality.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                    {roleTabs[activeTab].features.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                        <ShieldCheck size={20} className="text-[#A6C573]" />
                        <span className="font-bold tracking-wide text-sm sm:text-base">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="white" 
                    size="xl" 
                    radius="xl" 
                    className="h-14 font-extrabold tracking-wide text-[#07213C] shadow-lg hover:bg-gray-100 self-start px-10 border-none"
                    onClick={() => navigate(ROUTES.LOGIN)}
                  >
                    Launch Portal
                  </Button>
                </div>
              </Paper>
            </div>

          </div>
        </Container>
      </Box>

      {/* ─── ARCHITECTURE FEATURES ─── */}
      <Box id="features-grid" className="py-24 bg-white">
        <Container size="lg" px="md">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#07213C] mb-4">Robust Architecture Framework</h2>
            <div className="w-20 h-1 bg-[#769642] mx-auto rounded-full mb-6" />
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Enterprise-grade utility systems designed to withstand industrial loads.</p>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 1, md: 3 }} spacing={40}>
            {features.map((feat, i) => (
              <div key={i} className="bg-[#FAFAFA] p-8 rounded-3xl hover:bg-white hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col items-start group">
                <div className="p-5 bg-white rounded-2xl shadow-md text-[#769642] mb-6 transition-transform group-hover:scale-110 group-hover:bg-[#07213C] group-hover:text-white">
                  {feat.icon}
                </div>
                <h3 className="text-2xl font-extrabold text-[#07213C] mb-4">{feat.title}</h3>
                <p className="text-gray-500 leading-relaxed text-base font-medium">{feat.description}</p>
              </div>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ─── FINAL CTA BAND ─── */}
      <Box className="py-20 px-4 bg-[#07213C] relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#204A2A] transform skew-x-[-15deg] translate-x-1/4 z-0" />
        <Container size="lg" className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Ready to Advance Your Network?</h2>
              <p className="text-[#A6C573] text-lg font-medium">Unify your field, distribution, and oversight operations today.</p>
            </div>
            <Button 
              size="xl" 
              radius="xl" 
              style={{ backgroundColor: '#769642' }}
              className="h-16 px-12 hover:bg-[#5f7a35] border-none text-white shadow-xl font-black tracking-wide text-lg hover:-translate-y-1 transition-transform"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Contact Integration
            </Button>
          </div>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
};

export default LandingPage;
