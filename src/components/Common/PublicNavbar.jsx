import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Group,
  Stack,
  Drawer,
  Divider
} from "@mantine/core";
import {
  Menu as MenuIcon,
  X,
  ArrowRight
} from "lucide-react";
import ROUTES from "../../utils/routes/routes";
import LogoImg from "../../assets/images/amizhdhu-logo.png";

const PublicNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isLanding = location.pathname === "/";

    const navLinks = [
        { 
            label: "Home", 
            action: () => { 
                if (isLanding) window.scrollTo({ top: 0, behavior: "smooth" });
                else navigate("/");
                setMobileMenuOpen(false); 
            } 
        },
        { 
            label: "Features", 
            action: () => { 
                if (isLanding) document.getElementById("features-grid")?.scrollIntoView({ behavior: "smooth" });
                else navigate("/?scroll=features-grid");
                setMobileMenuOpen(false); 
            } 
        },
        { 
            label: "Roles", 
            action: () => { 
                if (isLanding) document.getElementById("role-tabs")?.scrollIntoView({ behavior: "smooth" });
                else navigate("/?scroll=role-tabs");
                setMobileMenuOpen(false); 
            } 
        },
        { 
            label: "Careers", 
            action: () => { 
                navigate(ROUTES.CAREERS); 
                setMobileMenuOpen(false); 
            } 
        },
    ];

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled 
                    ? "py-3 bg-white/90 backdrop-blur-lg shadow-md border-b border-gray-100" 
                    : "py-5 bg-transparent"
                }`}
            >
                <div className="w-full px-6 md:px-12 relative flex items-center justify-between">
                    
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
                        <div className={`transition-all duration-300 p-1.5 rounded-xl ${scrolled ? "bg-white shadow-sm" : "bg-white/20 backdrop-blur-sm"}`}>
                            <img src={LogoImg} alt="Amizhdhu Logo" className="h-10 md:h-12 w-auto object-contain" />
                        </div>
                    </div>

                    {/* Desktop Navigation - ABSOLUTELY CENTERED */}
                    <div className="hidden lg:flex items-center gap-10 absolute left-1/2 transform -translate-x-1/2">
                        {navLinks.map((link) => (
                            <button
                                key={link.label}
                                onClick={link.action}
                                className={`text-sm font-semibold tracking-wide uppercase transition-all relative group ${
                                    scrolled ? "text-[#07213C]" : "text-white"
                                }`}
                            >
                                <span>{link.label}</span>
                                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 bg-[#769642] group-hover:w-full`}></span>
                            </button>
                        ))}
                    </div>

                    {/* Action Section */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3">
                            <Button 
                                variant="subtle" 
                                onClick={() => navigate(ROUTES.LOGIN)}
                                style={{ color: scrolled ? '#07213C' : '#ffffff' }}
                                className={`font-bold tracking-wide hover:bg-white/10 border-0 transition-all duration-200`}
                            >
                                Log In
                            </Button>
                            <Button
                                variant="filled"
                                onClick={() => navigate(ROUTES.LOGIN)}
                                style={{ backgroundColor: '#769642' }}
                                className="hover:bg-[#5f7a35] text-white shadow-lg shadow-[#769642]/20 px-6 rounded-full transition-all hover:translate-y-[-1px] border-none"
                                rightSection={<ArrowRight size={16} />}
                            >
                                Get Started
                            </Button>
                        </div>

                        {/* Mobile Toggle */}
                        <button 
                            className={`lg:hidden p-2.5 rounded-xl backdrop-blur-md transition-all border border-transparent ${
                                scrolled 
                                ? "bg-[#07213C]/5 text-[#07213C] hover:bg-[#07213C]/10" 
                                : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                            }`} 
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <MenuIcon size={24} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Clean Mobile Drawer */}
            <Drawer
                opened={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                padding="xl"
                size="100%"
                transitionProps={{ transition: 'fade', duration: 250 }}
                styles={{
                    content: { backgroundColor: '#07213C' },
                    header: { backgroundColor: '#07213C', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' },
                    title: { color: 'white' },
                    close: { color: 'white', hover: { backgroundColor: 'rgba(255,255,255,0.1)'} }
                }}
                title={
                    <div className="flex items-center gap-3">
                        <img src={LogoImg} alt="Amizhdhu" className="h-9 w-auto bg-white rounded-lg p-1 shadow-md" />
                        <span className="font-bold tracking-wider text-white">AMIZHDHU</span>
                    </div>
                }
            >
                <div className="flex flex-col justify-between h-full pt-10 pb-6">
                    <Stack gap="lg">
                        {navLinks.map((link) => (
                            <button 
                                key={link.label} 
                                onClick={link.action} 
                                className="group w-full flex items-center justify-between text-left py-4 border-b border-white/10 text-white font-bold text-xl tracking-wide transition-all hover:pl-2 hover:text-[#769642]"
                            >
                                <span>{link.label}</span>
                                <ArrowRight size={20} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </button>
                        ))}
                    </Stack>
                    
                    <Stack gap="md" mt="xl">
                        <Button 
                            fullWidth 
                            size="lg"
                            variant="outline" 
                            className="border-white/30 text-white hover:bg-white/10 rounded-xl h-14 text-lg"
                            onClick={() => navigate(ROUTES.LOGIN)}
                        >
                            Sign In
                        </Button>
                        <Button 
                            fullWidth 
                            size="lg"
                            variant="filled" 
                            style={{ backgroundColor: '#769642' }}
                            className="hover:bg-[#5f7a35] border-none text-white rounded-xl shadow-xl h-14 text-lg font-bold"
                            onClick={() => navigate(ROUTES.LOGIN)}
                        >
                            Get Started Now
                        </Button>
                    </Stack>
                </div>
            </Drawer>
        </>
    );
};

export default PublicNavbar;
