"use client";
import React, { useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { useUser } from '@clerk/nextjs';
import axios from 'axios'
import { UserDetailContext } from '@/context/UserDetailContext';
import Header from './_components/Header';


function Provider({
  children,
  ...props
  }: React.ComponentProps<typeof NextThemesProvider>){

    const {user} = useUser();
    const [userDetail,setUserDetail] = useState();

    useEffect(()=>{
        user&&CreateNewUser();
    },[user])

    const CreateNewUser = async ()=>{
        const result=await axios.post('/api/user',{});
        console.log(result);
        setUserDetail(result?.data);
    }


    return(
        <NextThemesProvider {...props}>
            <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
                {/* Header / NavBar */}
                <div className='flex flex-col items-center'><Header /></div>
                {children}
            </UserDetailContext.Provider>
        </NextThemesProvider>
    )
}

export default Provider
