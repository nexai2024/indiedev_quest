"use client";
import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { UserDetailContext } from "@/context/UserDetailContext";
import Header from "./_components/Header";
import PixelAIMentor from "@/components/PixelAIMentor";
import ScreenGuide from "@/components/ScreenGuide";
import { usePathname, useRouter } from "next/navigation";
import { hasCompletedOnboarding } from "@/lib/user-profile";

function Provider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const { user, isSignedIn } = useUser();
  const [userDetail, setUserDetail] = useState();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isOnboarding = pathname.startsWith("/onboarding");
  const profileLoaded = userDetail !== undefined;
  const onboarded = hasCompletedOnboarding(userDetail);

  useEffect(() => {
    user && CreateNewUser();
  }, [user]);

  useEffect(() => {
    if (!isSignedIn || !profileLoaded || isAuthPage) return;
    if (!onboarded && !isOnboarding) {
      router.replace("/onboarding");
    }
  }, [isSignedIn, profileLoaded, onboarded, isAuthPage, isOnboarding, router]);

  const CreateNewUser = async () => {
    try {
      const result = await axios.post("/api/user", {});
      setUserDetail(result?.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NextThemesProvider {...props}>
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        <div className="flex min-h-dvh flex-col">
          {!isAuthPage && isSignedIn && profileLoaded && <Header onboarded={onboarded} />}
          {!isAuthPage && isSignedIn && profileLoaded && <ScreenGuide />}
          <div className="flex-1">{children}</div>
        </div>
        {!isAuthPage && isSignedIn && onboarded && <PixelAIMentor />}
      </UserDetailContext.Provider>
    </NextThemesProvider>
  );
}

export default Provider;
