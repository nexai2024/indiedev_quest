import { Button } from '@/components/ui/button'
import  Link from 'next/link'
import Image from 'next/image'
import React from 'react'

function Hero() {
  return (
    <div className='w-full relative h-screen'>
      <Image src={'/hero.gif'} alt='hero' width={1000} height={1000}
      className='w-full h-full object-cover absolute inset-0' />

      <div className='absolute w-full flex flex-col items-center mt-19'>
        <h2 className='font-bold text-7xl font-game'>Start Your </h2>
        <h2 className='font-bold text-8xl font-game text-yellow-400'
        style={{
            textShadow:"2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000"
        }}
        >Coding Adventure</h2>

        <h2 className='mt-5 font-game text-3xl'>Begginer friendly coding courses and projects</h2>
        <Link href={'/sign-in'}>
        <Button className='font-game text-3xl p-6 mt-7' variant={'pixel'}>GET STARTED</Button>
        </Link>
      </div>
    </div>
  )
}

export default Hero
