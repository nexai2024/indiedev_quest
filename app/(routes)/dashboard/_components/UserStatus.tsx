"use client"
import { UserDetailContext } from '@/context/UserDetailContext';
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import React, { useContext } from 'react'


function UserStatus() {
    const {user} = useUser();
    const {userDetail,setUserDetail} = useContext(UserDetailContext);
  return (
    <div className='p-4 border-2 rounded-2xl ml-5'>
        <div className='flex gap-3 items-center'>
      <Image src={'/alex_walk.gif'} alt='walking_user' width={70} height={70} />
      <h2 className='font-game text-2xl'>{user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress} </h2>
      </div>

      <div className='grid grid-cols-2 gap-5'>
        <div className='flex gap-3 items-center '>
            <Image src={'/star.png'} alt='star' width={35} height={35} />
            <div>
                <h2 className='text-4xl font-game'>{userDetail?.points ?? 0}</h2>
                <h2 className='font-game text-gray-500 text-xl'>Total Rewards</h2>
            </div>
        </div>
      </div>
      <div className='flex gap-3 items-center '>
            <Image src={'/badge.png'} alt='badge' width={35} height={35} />
            <div>
                <h2 className='text-4xl font-game'>0</h2>
                <h2 className='font-game text-gray-500 text-xl'>Badge</h2>
            </div>
        </div>
        <div className='flex gap-3 items-center '>
            <Image src={'/fire.png'} alt='star' width={35} height={35} />
            <div>
                <h2 className='text-4xl font-game'>0</h2>
                <h2 className='font-game text-gray-500 text-xl'>Daily Streak</h2>
            </div>
        </div>

    </div>
  )
}

export default UserStatus
