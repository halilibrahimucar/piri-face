"use client";
import React, { Suspense } from "react";
import dynamic from 'next/dynamic';

// Yükleme göstergesi bileşeni
const LoadingIndicator = () => (
  <div className="w-full aspect-square flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
    <p className="text-white mt-4">Yükleniyor...</p>
  </div>
);

// SimliElevenlabs bileşenini client-side olarak yüklüyoruz
const SimliElevenlabs = dynamic(() => import('./SimliElevenlabs'), {
  ssr: false,
  loading: () => <LoadingIndicator />
});

interface avatarSettings {
  elevenlabs_agentid: string;
  simli_faceid: string;
}

const avatar: avatarSettings = {
  elevenlabs_agentid: "HvGffXvizOsT2u8dUPzf",
  simli_faceid: "460cd7eb-b718-4d11-b870-f3a723704c4b",
};

const Demo = () => {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-black">
      <div className="w-full h-full flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="w-full aspect-square">
            <Suspense fallback={<LoadingIndicator />}>
              <SimliElevenlabs
                agentId={avatar.elevenlabs_agentid}
                simli_faceid={avatar.simli_faceid}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Demo;