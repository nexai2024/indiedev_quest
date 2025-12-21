"use client"
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import React from 'react'


function WelcomeBanner() {
    const {user}=useUser();
  return (
    <div className='flex gap-3 items-center'>
      <Image src={'/machine.webp'} alt='robo' height={120} width={120}></Image>
      <h2 className='font-game text-2xl p-4 border bg-zinc-800 rounded-lg rounded-bl-none'>Welcome Back <span className='text-yellow-500'>{user?.fullName}</span>, Start Learning something new... </h2>
    </div>
  )
}

export default WelcomeBanner
