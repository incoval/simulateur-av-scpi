import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientInfo from "@/components/ClientInfo";
import SCPITab from "@/components/SCPITab";
import AssuranceVieTab from "@/components/AssuranceVieTab";
import PERTab from "@/components/PERTab";

const Index = () => {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("");

  const clientInfo = { nom, prenom, age };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-serif text-foreground">
            Simulateur de projection
            <span className="text-muted-foreground font-sans text-base sm:text-lg ml-2 font-normal">
              SCPI · Assurance Vie · PER
            </span>
          </h1>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <ClientInfo
          nom={nom}
          prenom={prenom}
          age={age}
          onNomChange={setNom}
          onPrenomChange={setPrenom}
          onAgeChange={v => {
            const n = parseInt(v);
            if (v === "" || (n >= 0 && n <= 100)) setAge(v);
          }}
        />

        <Tabs defaultValue="scpi" className="w-full">
          <TabsList className="bg-secondary/60 mb-6">
            <TabsTrigger value="scpi" className="font-medium">SCPI</TabsTrigger>
            <TabsTrigger value="av" className="font-medium">Assurance Vie</TabsTrigger>
            <TabsTrigger value="per" className="font-medium">PER</TabsTrigger>
          </TabsList>

          <TabsContent value="scpi">
            <SCPITab clientInfo={clientInfo} />
          </TabsContent>
          <TabsContent value="av">
            <AssuranceVieTab clientInfo={clientInfo} />
          </TabsContent>
          <TabsContent value="per">
            <PERTab clientInfo={clientInfo} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
