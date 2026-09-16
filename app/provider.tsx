"use client";
import React, { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { UserDetailContext } from '@/context/UserDetailContext';
import Header from './_components/Header';
import PixelAIMentor from '@/components/PixelAIMentor';

function Provider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {

  const { user } = useUser();
  const [userDetail, setUserDetail] = useState();

  useEffect(() => {
    user && CreateNewUser();
  }, [user]);

  const CreateNewUser = async () => {
    try {
      const result = await axios.post('/api/user', {});
      setUserDetail(result?.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NextThemesProvider {...props}>
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        {/* Header / NavBar */}
        <div className='flex flex-col items-center'><Header /></div>
        {children}
        {/* Floating Pixel AI Mentor Companion */}
        <PixelAIMentor />
      </UserDetailContext.Provider>
    </NextThemesProvider>
  );
}

export default Provider;
