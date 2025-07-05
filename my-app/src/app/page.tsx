"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TuteTimer } from "@/components/TuteTimer";
import { VerifyButton } from "@/components/VerifyButton";
import { ClaimButton } from "@/components/ClaimButton";
import { WalletAuthButton } from "@/components/wallet-auth-button";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";
import { createPublicClient, http } from "viem";
import { worldchain } from "@/lib/chains";
import { TransactionStatus } from "@/components/TransactionStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Users, Vote, User, Home, Plus, Clock, ChevronRight, Upload, Settings } from "lucide-react";

// This would come from environment variables in a real app
const APP_ID =
  process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID ||
  "app_9a73963d73efdf2e7d9472593dc9dffd";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const [walletConnected, setWalletConnected] = useState(false);
  const [verified, setVerified] = useState(false);
  const [tuteClaimed, setTuteClaimed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [claimCount, setClaimCount] = useState(0);
  const [transactionId, setTransactionId] = useState<string>("");
  const [isMinting, setIsMinting] = useState(false);
  const [step, setStep] = useState<"login" | "verify" | "dashboard" | "wallet_connect" | "world_id_verify">("wallet_connect");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [societies, setSocieties] = useState([
    {
      id: 1,
      name: "Tech Innovators",
      description: "A community for tech enthusiasts and innovators",
      members: 156,
      proposals: 8,
      isJoined: true,
      category: "Technology",
      logo: "/placeholder.svg?height=40&width=40",
      isWorldVerified: true,
    },
    {
      id: 2,
      name: "Green Earth Initiative",
      description: "Environmental activists working for a sustainable future",
      members: 89,
      proposals: 12,
      isJoined: true,
      category: "Environment",
      logo: "/placeholder.svg?height=40&width=40",
      isWorldVerified: true,
    },
    {
      id: 3,
      name: "Local Artists Collective",
      description: "Supporting local artists and creative projects",
      members: 234,
      proposals: 5,
      isJoined: false,
      category: "Arts",
      logo: "/placeholder.svg?height=40&width=40",
      isWorldVerified: true,
    },
    {
      id: 4,
      name: "Crypto Builders",
      description: "Building the future of decentralized finance",
      members: 312,
      proposals: 15,
      isJoined: false,
      category: "Technology",
      logo: "/placeholder.svg?height=40&width=40",
      isWorldVerified: true,
    },
  ]);

  const [proposals, setProposals] = useState([
    {
      id: 1,
      societyId: 1,
      societyName: "Tech Innovators",
      title: "Organize Annual Tech Conference",
      description: "Proposal to organize our annual tech conference with a budget of $50,000",
      votes: { for: 45, against: 12 },
      status: "active",
      timeLeft: "5 days",
      hasVoted: false,
      type: "single-choice",
      options: ["Approve Budget", "Reject Budget"],
    },
    {
      id: 2,
      societyId: 1,
      societyName: "Tech Innovators",
      title: "New Mentorship Program",
      description: "Launch a mentorship program connecting senior and junior members",
      votes: { for: 67, against: 8 },
      status: "active",
      timeLeft: "2 days",
      hasVoted: true,
      type: "single-choice",
      options: ["Support Program", "Need More Details"],
    },
    {
      id: 3,
      societyId: 2,
      societyName: "Green Earth Initiative",
      title: "Community Garden Project",
      description: "Establish a community garden in the downtown area",
      votes: { for: 34, against: 5 },
      status: "active",
      timeLeft: "1 week",
      hasVoted: false,
      type: "single-choice",
      options: ["Approve Project", "Reject Project"],
    },
  ]);

  const [currentView, setCurrentView] = useState<
    "home" | "daos" | "proposals" | "profile" | "create-dao" | "dao-detail" | "proposal-detail"
  >("home");
  const [selectedSociety, setSelectedSociety] = useState<any>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  // Initialize Viem client
  const client = createPublicClient({
    chain: worldchain,
    transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
  });

  // Track transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      client,
      appConfig: {
        app_id: process.env.NEXT_PUBLIC_WLD_APP_ID || APP_ID,
      },
      transactionId,
    });

  // Check if user is authenticated when session changes
  useEffect(() => {
    if (status === "authenticated" && session?.user?.address) {
      setWalletConnected(true);
      console.log("User authenticated:", session.user);
      setStep("world_id_verify");
    }
  }, [session, status]);

  // Update UI when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && !tuteClaimed) {
      setTuteClaimed(true);
      setClaimCount((prevCount) => prevCount + 1);
      setIsMinting(false);
    }
  }, [isConfirmed, tuteClaimed]);

  // Handle wallet connection success
  const handleWalletConnected = () => {
    setWalletConnected(true);
    console.log("Wallet connected");
    setStep("world_id_verify");
  };

  // Handle verification success
  const handleVerificationSuccess = () => {
    console.log("Verification success callback triggered in TuteApp");
    setVerified(true);
    setStep("login");
  };

  // Handle claim success
  const handleClaimSuccess = (txId: string) => {
    console.log("Claim initiated with transaction ID:", txId);
    setTransactionId(txId);
    setIsMinting(true);
  };

  // Timer effect for claim cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (tuteClaimed && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setTuteClaimed(false);
      setVerified(false);
      setTimeRemaining(300);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tuteClaimed, timeRemaining]);

  const handleLogin = () => {
    if (email) {
      setStep("dashboard");
    }
  };

  const handleVerification = () => {
    if (verificationCode) {
      setStep("dashboard");
    }
  };

  const joinSociety = (societyId: number) => {
    setSocieties(societies.map((s) => (s.id === societyId ? { ...s, isJoined: true, members: s.members + 1 } : s)));
  };

  const createSociety = (societyData: any) => {
    const newSociety = {
      id: societies.length + 1,
      ...societyData,
      members: 1,
      proposals: 0,
      isJoined: true,
      logo: "/placeholder.svg?height=40&width=40",
      isWorldVerified: true,
    };
    setSocieties([...societies, newSociety]);
    setCurrentView("home");
  };

  const createProposal = (proposalData: any) => {
    const newProposal = {
      id: proposals.length + 1,
      ...proposalData,
      societyName: selectedSociety?.name || "Unknown",
      votes: { for: 0, against: 0 },
      status: "active",
      timeLeft: "1 week",
      hasVoted: false,
      type: "single-choice",
      options: ["Support", "Oppose"],
    };
    setProposals([...proposals, newProposal]);
    setCurrentView("dao-detail");
  };

  const vote = (proposalId: number, voteType: "for" | "against") => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              votes: {
                ...p.votes,
                [voteType]: p.votes[voteType] + 1,
              },
              hasVoted: true,
            }
          : p,
      ),
    );
  };

  if (step === "wallet_connect") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
            DAOversity
          </h1>
          <p className="text-gray-600">Connect your wallet to get started with DAOversity.</p>
          <WalletAuthButton onWalletConnected={handleWalletConnected} />
        </div>
      </div>
    );
  }

  if (step === "world_id_verify") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
            DAOversity
          </h1>
          <p className="text-gray-600">Verify your identity with World ID to access the DAO app.</p>
          <VerifyButton onSuccess={handleVerificationSuccess} />
        </div>
      </div>
    );
  }

  if (step === "login") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
              DAOversity
            </h1>
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-full">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="text-center">
              <CardTitle>Welcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
              DAOversity
            </h1>
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-full">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Verify Your Identity
              </CardTitle>
              <CardDescription>We've sent a verification code to {email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Demo:</strong> Enter any 6-digit code to continue
                </p>
              </div>
              <Button
                onClick={handleVerification}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                Verify & Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      currentView={currentView}
      setCurrentView={setCurrentView}
      societies={societies}
      setSocieties={setSocieties}
      proposals={proposals}
      setProposals={setProposals}
      selectedSociety={selectedSociety}
      setSelectedSociety={setSelectedSociety}
      selectedProposal={selectedProposal}
      setSelectedProposal={setSelectedProposal}
      joinSociety={joinSociety}
      createSociety={createSociety}
      createProposal={createProposal}
      vote={vote}
    />
  );
}

function Dashboard({
  currentView,
  setCurrentView,
  societies,
  setSocieties,
  proposals,
  setProposals,
  selectedSociety,
  setSelectedSociety,
  selectedProposal,
  setSelectedProposal,
  joinSociety,
  createSociety,
  createProposal,
  vote,
}: any) {
  if (currentView === "create-dao") {
    return <CreateDAOFlow onCreateSociety={createSociety} onBack={() => setCurrentView("home")} />;
  }

  if (currentView === "dao-detail") {
    return (
      <DAODetailPage
        society={selectedSociety}
        proposals={proposals.filter((p) => p.societyId === selectedSociety?.id)}
        onBack={() => setCurrentView("daos")}
        onCreateProposal={createProposal}
        onJoin={() => joinSociety(selectedSociety.id)}
      />
    );
  }

  if (currentView === "proposal-detail") {
    return <ProposalDetailPage proposal={selectedProposal} onBack={() => setCurrentView("proposals")} onVote={vote} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-green-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
              DAOversity
            </h1>
            <img
              src="/images/profile-avatar.jpg"
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover border-2 border-green-200"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-20">
        {currentView === "home" && (
          <HomeScreen
            societies={societies}
            proposals={proposals}
            onCreateDAO={() => setCurrentView("create-dao")}
            onJoinDAO={joinSociety}
            onViewDAO={(society) => {
              setSelectedSociety(society);
              setCurrentView("dao-detail");
            }}
          />
        )}

        {currentView === "daos" && (
          <DAOsScreen
            societies={societies}
            onJoinDAO={joinSociety}
            onViewDAO={(society) => {
              setSelectedSociety(society);
              setCurrentView("dao-detail");
            }}
          />
        )}

        {currentView === "proposals" && (
          <ProposalsScreen
            societies={societies}
            proposals={proposals}
            onViewProposal={(proposal) => {
              setSelectedProposal(proposal);
              setCurrentView("proposal-detail");
            }}
            onVote={vote}
          />
        )}

        {currentView === "profile" && <ProfileScreen societies={societies} proposals={proposals} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex">
          <button
            onClick={() => setCurrentView("home")}
            className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${
              currentView === "home" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setCurrentView("daos")}
            className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${
              currentView === "daos" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">DAOs</span>
          </button>
          <button
            onClick={() => setCurrentView("proposals")}
            className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${
              currentView === "proposals" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <Vote className="h-5 w-5" />
            <span className="text-xs font-medium">Proposals</span>
          </button>
          <button
            onClick={() => setCurrentView("profile")}
            className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${
              currentView === "profile" ? "text-green-600" : "text-gray-500"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ societies, proposals, onCreateDAO, onJoinDAO, onViewDAO }: any) {
  const joinedSocieties = societies.filter((s) => s.isJoined);
  const suggestedSocieties = societies.filter((s) => !s.isJoined);
  const featuredProposals = proposals.filter((p) => joinedSocieties.some((s) => s.id === p.societyId)).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-green-100 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Hi Alex 👋</h2>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">World Verified</span>
              </div>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create DAO Button */}
      <Button
        onClick={onCreateDAO}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create a DAO
      </Button>

      {/* Suggested DAOs */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Suggested DAOs</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {suggestedSocieties.map((society) => (
            <Card
              key={society.id}
              className="min-w-[200px] border-green-100 bg-gradient-to-br from-white to-green-50/30 cursor-pointer"
              onClick={() => onViewDAO(society)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <img src={society.logo || "/placeholder.svg"} alt={society.name} className="h-8 w-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{society.name}</h4>
                    <p className="text-xs text-gray-500">{society.members} members</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoinDAO(society.id);
                  }}
                >
                  Join
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Proposals */}
      {featuredProposals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Featured Proposals</h3>
          <div className="space-y-3">
            {featuredProposals.map((proposal) => (
              <Card key={proposal.id} className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                      <p className="text-sm text-gray-600">{proposal.societyName}</p>
                    </div>
                    <Badge
                      variant={proposal.hasVoted ? "secondary" : "outline"}
                      className={proposal.hasVoted ? "bg-green-100 text-green-800" : "bg-green-100 text-black"}
                    >
                      {proposal.hasVoted ? "Voted" : proposal.timeLeft}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-xs">
                      <span className="text-green-600">👍 {proposal.votes.for}</span>
                      <span className="text-red-600">👎 {proposal.votes.against}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DAOsScreen({ societies, onJoinDAO, onViewDAO }: any) {
  const joinedSocieties = societies.filter((s) => s.isJoined);
  const exploreSocieties = societies.filter((s) => !s.isJoined);

  return (
    <div className="space-y-6">
      {/* My DAOs Section */}
      {joinedSocieties.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">My DAOs</h2>
          <div className="space-y-3">
            {joinedSocieties.map((society) => (
              <Card
                key={society.id}
                className="border-green-100 bg-gradient-to-br from-white to-green-50/30 cursor-pointer"
                onClick={() => onViewDAO(society)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={society.logo || "/placeholder.svg"}
                      alt={society.name}
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{society.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{society.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{society.members} members</span>
                          <span>{society.proposals} proposals</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Member
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Explore New DAOs Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Explore New DAOs</h2>
        <div className="space-y-3">
          {exploreSocieties.map((society) => (
            <Card
              key={society.id}
              className="border-green-100 bg-gradient-to-br from-white to-green-50/30 cursor-pointer"
              onClick={() => onViewDAO(society)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <img src={society.logo || "/placeholder.svg"} alt={society.name} className="h-12 w-12 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{society.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{society.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>{society.members} members</span>
                        <span>{society.proposals} proposals</span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoinDAO(society.id);
                        }}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProposalsScreen({ societies, proposals, onViewProposal, onVote }: any) {
  const joinedSocieties = societies.filter((s) => s.isJoined);

  // Group proposals by category
  const proposalsByCategory = proposals.reduce((acc, proposal) => {
    const society = societies.find((s) => s.id === proposal.societyId);
    const category = society?.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(proposal);
    return acc;
  }, {});

  // Filter to only show proposals from joined DAOs
  const myProposalsByCategory = Object.keys(proposalsByCategory).reduce((acc, category) => {
    const categoryProposals = proposalsByCategory[category].filter((p) =>
      joinedSocieties.some((s) => s.id === p.societyId),
    );
    if (categoryProposals.length > 0) {
      acc[category] = categoryProposals;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.keys(myProposalsByCategory).length === 0 ? (
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="p-6 text-center">
            <Vote className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">No Proposals Yet</h3>
            <p className="text-sm text-gray-600">Join some DAOs to see and vote on proposals!</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(myProposalsByCategory).map(([category, categoryProposals]) => (
          <div key={category}>
            <h3 className="text-md font-semibold mb-3 text-green-700">{category}</h3>
            <div className="space-y-3">
              {categoryProposals.map((proposal) => (
                <Card
                  key={proposal.id}
                  className="border-green-100 bg-gradient-to-br from-white to-green-50/30 cursor-pointer"
                  onClick={() => onViewProposal(proposal)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{proposal.title}</h4>
                        <p className="text-sm text-gray-600">{proposal.societyName}</p>
                      </div>
                      <Badge
                        variant={proposal.hasVoted ? "secondary" : "outline"}
                        className={proposal.hasVoted ? "bg-green-100 text-green-800" : "bg-green-100 text-black"}
                      >
                        {proposal.hasVoted ? "You Voted" : "Vote Now"}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs bg-green-100 text-black px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        {proposal.timeLeft}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-600">👍 {proposal.votes.for}</span>
                        <span className="text-red-600">👎 {proposal.votes.against}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ProfileScreen({ societies, proposals }: any) {
  const joinedSocieties = societies.filter((s) => s.isJoined);
  const votedProposals = proposals.filter((p) => p.hasVoted);

  return (
    <div className="space-y-4">
      {/* User Info */}
      <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
        <CardContent className="p-4 text-center">
          <img
            src="/images/profile-avatar.jpg"
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-green-200 mx-auto mb-4"
          />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Alex Johnson</h3>
          <p className="text-sm text-gray-600 mb-2">0x1234...5678</p>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            World ID Verified
          </Badge>
        </CardContent>
      </Card>

      {/* DAOs Joined */}
      <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
        <CardHeader>
          <CardTitle className="text-base">DAOs Joined ({joinedSocieties.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {joinedSocieties.map((society) => (
              <div key={society.id} className="flex items-center gap-3">
                <img src={society.logo || "/placeholder.svg"} alt={society.name} className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{society.name}</p>
                  <p className="text-xs text-gray-500">{society.members} members</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
        <CardHeader>
          <CardTitle className="text-base">Proposals Voted On ({votedProposals.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {votedProposals.map((proposal) => (
              <div key={proposal.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm">{proposal.title}</p>
                  <p className="text-xs text-gray-500">{proposal.societyName}</p>
                </div>
                <Badge variant="secondary">Voted</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent border-green-200 text-green-700 hover:bg-green-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Dark Mode Toggle
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent border-green-200 hover:bg-red-50"
          >
            Logout / Disconnect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateDAOFlow({ onCreateSociety, onBack }: any) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    worldIdBound: true,
    logo: null,
    joinType: "open",
    votingModel: "one-human-one-vote",
    quorum: 50,
    voteDuration: 7,
    moderationEnabled: false,
    bannedKeywords: "",
    moderationMode: "soft-block",
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onCreateSociety({
      name: formData.name,
      description: formData.description,
      category: "Community",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-green-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={currentStep === 1 ? onBack : handlePrevious}>
            ←
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Create DAO</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div
                  className="bg-green-600 h-1 rounded-full transition-all"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{currentStep}/4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {currentStep === 1 && (
          <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
            <CardHeader>
              <CardTitle>DAO Basics</CardTitle>
              <CardDescription>Set up the foundation of your DAO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">DAO Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter DAO name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your DAO's purpose"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>World ID Bound</Label>
                  <p className="text-sm text-gray-600">Only real humans can join</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.worldIdBound}
                  onChange={(e) => setFormData({ ...formData, worldIdBound: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload logo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
            <CardHeader>
              <CardTitle>Access + Governance</CardTitle>
              <CardDescription>Configure how your DAO operates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>DAO Join Type</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="joinType"
                      value="open"
                      checked={formData.joinType === "open"}
                      onChange={(e) => setFormData({ ...formData, joinType: e.target.value })}
                    />
                    <span>Open to all verified humans</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="joinType"
                      value="request"
                      checked={formData.joinType === "request"}
                      onChange={(e) => setFormData({ ...formData, joinType: e.target.value })}
                    />
                    <span>Request-based (owner must approve)</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Voting Model</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="votingModel"
                      value="one-human-one-vote"
                      checked={formData.votingModel === "one-human-one-vote"}
                      onChange={(e) => setFormData({ ...formData, votingModel: e.target.value })}
                    />
                    <span>1 human = 1 vote (via World ID)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="votingModel"
                      value="token-weighted"
                      checked={formData.votingModel === "token-weighted"}
                      onChange={(e) => setFormData({ ...formData, votingModel: e.target.value })}
                    />
                    <span>Token-weighted (optionally issue ERC20)</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
            <CardHeader>
              <CardTitle>Content Filters</CardTitle>
              <CardDescription>Set up moderation for your DAO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Activate Moderation Filter</Label>
                  <p className="text-sm text-gray-600">Enable content moderation</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.moderationEnabled}
                  onChange={(e) => setFormData({ ...formData, moderationEnabled: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
              {formData.moderationEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Banned Keywords/Phrases</Label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md resize-none"
                      rows={3}
                      value={formData.bannedKeywords}
                      onChange={(e) => setFormData({ ...formData, bannedKeywords: e.target.value })}
                      placeholder="Enter banned words, separated by commas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Moderation Mode</Label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-md"
                      value={formData.moderationMode}
                      onChange={(e) => setFormData({ ...formData, moderationMode: e.target.value })}
                    >
                      <option value="soft-block">Soft Block</option>
                      <option value="auto-delete">Auto Delete</option>
                      <option value="flag">Flag for Review</option>
                    </select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Review your DAO configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">DAO Name</h4>
                  <p className="text-sm text-gray-600">{formData.name}</p>
                </div>
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-gray-600">{formData.description}</p>
                </div>
                <div>
                  <h4 className="font-medium">World ID Bound</h4>
                  <p className="text-sm text-gray-600">{formData.worldIdBound ? "Yes" : "No"}</p>
                </div>
                <div>
                  <h4 className="font-medium">Join Type</h4>
                  <p className="text-sm text-gray-600">
                    {formData.joinType === "open" ? "Open to all verified humans" : "Request-based"}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>World ID Action:</strong> Creating DAO will require World ID verification
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex gap-3">
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              disabled={!formData.name || !formData.description}
            >
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              🎉 Create DAO
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DAODetailPage({ society, proposals, onBack, onCreateProposal, onJoin }: any) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-green-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900">{society.name}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* DAO Banner */}
        <Card className="border-green-100 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img
                src={society.logo || "/placeholder.svg"}
                alt={society.name}
                className="h-16 w-16 rounded-full border-2 border-white"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold">{society.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Human Verified</span>
                </div>
                <p className="text-sm mt-2 opacity-90">{society.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Join Button */}
        {!society.isJoined && (
          <Button
            onClick={onJoin}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3"
          >
            <Users className="h-5 w-5 mr-2" />
            Join DAO (World ID Required)
          </Button>
        )}

        {/* Member Count */}
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span>Members</span>
              <span>{society.members}</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Proposals */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Active Proposals</h3>
            {society.isJoined && (
              <Button
                onClick={onCreateProposal}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                    <Badge
                      variant={proposal.hasVoted ? "secondary" : "outline"}
                      className={proposal.hasVoted ? "bg-green-100 text-green-800" : "bg-green-100 text-black"}
                    >
                      {proposal.hasVoted ? "Voted" : proposal.timeLeft}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-xs">
                      <span className="text-green-600">👍 {proposal.votes.for}</span>
                      <span className="text-red-600">👎 {proposal.votes.against}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProposalDetailPage({ proposal, onBack, onVote }: any) {
  const [selectedOption, setSelectedOption] = useState("");

  const handleVote = () => {
    if (selectedOption) {
      onVote(proposal.id, selectedOption === proposal.options[0] ? "for" : "against");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-green-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Proposal</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Proposal Header */}
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-900">{proposal.title}</h2>
              <Badge variant="outline" className="bg-green-100 text-black">
                {proposal.timeLeft}
              </Badge>
            </div>
            <p className="text-sm text-green-600 mb-3">{proposal.societyName}</p>
            <p className="text-gray-700">{proposal.description}</p>
          </CardContent>
        </Card>

        {/* Voting Options */}
        {!proposal.hasVoted && (
          <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
            <CardHeader>
              <CardTitle className="text-base">Cast Your Vote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposal.options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-green-50"
                >
                  <input
                    type="radio"
                    name="vote"
                    value={option}
                    checked={selectedOption === option}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="font-medium">{option}</span>
                </label>
              ))}
              <Button
                onClick={handleVote}
                disabled={!selectedOption}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                Cast Vote (World ID Required)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Vote Results */}
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
          <CardHeader>
            <CardTitle className="text-base">Vote Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">For: {proposal.votes.for}</span>
                <span className="text-red-600">👎 {proposal.votes.against}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${(proposal.votes.for / (proposal.votes.for + proposal.votes.against || 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="text-center text-sm text-gray-600">
                Total Votes: {proposal.votes.for + proposal.votes.against}
              </div>
            </div>
          </CardContent>
        </Card>

        {proposal.hasVoted && (
          <Card className="border-green-100 bg-gradient-to-br from-green-50 to-green-100/30">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-800">You have already voted on this proposal</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
