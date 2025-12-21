"use client"

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import  Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { useParams, usePathname } from 'next/navigation'
import axios from 'axios'
import { Course } from '../(routes)/courses/_components/CourseList'




function Header() {

  const {user}=useUser();
  const path = usePathname();
  //console.log(path);
  const { exerciseslug }=useParams();
  const [courses,setCourses]=useState<Course[]>()

  useEffect(()=>{
    GetCourse()
  },[])

  const GetCourse= async()=>{
    const result=await axios.get('/api/course');
    console.log(result.data);
    setCourses(result.data);
  }


  return (
    <div className='p-4 max-w-7xl flex justify-between items-center w-full'>
        <div className='flex gap-2 items-center'>
            <Image src={'/logo.png'} alt='logo' width={40} height={40} />
            <h2 className='font-bold text-3xl font-game'>CodeBox</h2>
        </div>
        {/*Navbar*/}
        {!exerciseslug && courses ? <NavigationMenu>
            <NavigationMenuList className='gap-8'>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Courses</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className='grid md:grid-cols-2 gap-2 sm:w-[400px] md:w-[500px] lg:w-[600px]'>
                            {courses.map((course,index)=>(
                              <Link href={'/courses/'+course?.courseId}  key={index}>
                                <div className='p-2 hover:bg-accent rounded-2xl cursor-pointer'>
                                    <h2 className='font-medium'>{course?.title}</h2>
                                    <p className='text-sm text-gray-500'>{course.desc}</p>
                                </div> </Link>
                            ))}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink href={'/projects'}>Projects</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink href={'/pricing'}>Pricing</NavigationMenuLink>
                </NavigationMenuItem><NavigationMenuItem>
                    <NavigationMenuLink href={'/contact-us'}>Contact Us</NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>:
              <h2 className='font-game text-2xl'>{exerciseslug?.toString()?.replaceAll("-",' ')?.toLocaleUpperCase()}</h2>
        }
        {/*Sign-up Button*/}
        {!user?
        <Link href={'/sign-in'}>
          <Button className='font-game text-2xl' variant={'pixel'}>Sign Up</Button>
        </Link>
        : <div className='flex gap-4 items-center'>
          
          <Link href={'/dashboard'}>
            <Button className='font-game text-2xl' variant={'pixel'}>DashBoard</Button>
          </Link>

          <UserButton></UserButton>
        </div>}
    </div>
  )
}

export default Header
