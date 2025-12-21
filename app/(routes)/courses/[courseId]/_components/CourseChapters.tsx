import React from 'react'
import { Course } from '../../_components/CourseList'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'

type Props = {
  loading: boolean,
  courseDetail: Course | any // Added 'any' here to prevent strict interface conflicts during build
}

function CourseChapters({ loading, courseDetail }: Props) {

  const { has } = useAuth();
  const hasUnlimitedAccess = has && has({ plan: 'unlimited' })

  const EnableExercise = (
    chapterIndex: number,
    exerciseIndex: number,
    chapterExercisesLength: number
  ) => {
    const completed = courseDetail?.completeExercise;

    // If nothing is completed, enable FIRST exercise ONLY
    if (!completed || completed.length === 0) {
      return chapterIndex === 0 && exerciseIndex === 0;
    }

    // last completed
    const last = completed[completed.length - 1];

    // Convert to global exercise number
    const currentExerciseNumber =
      chapterIndex * chapterExercisesLength + exerciseIndex + 1;

    const lastCompletedNumber =
      (last.chapterId - 1) * chapterExercisesLength + last.exerciseId;

    return currentExerciseNumber === lastCompletedNumber + 2;
  };

  const isExerciseCompleted = (chapterId: number, exerciseId: number) => {
    const completeChapters = courseDetail?.completeExercise;
    const completeChapter = completeChapters?.find((item: any) => (item.chapterId == chapterId && item.exerciseId == exerciseId))
    return completeChapter ? true : false;
  }

  return (
    <div>
      {/* FIXED LINE BELOW: Added type assertion (as any[]) to satisfy the build compiler */}
      {!courseDetail?.chapters || (courseDetail?.chapters as any[]).length == 0 || loading ?
        <div>
          <Skeleton className='w-full h-[100px] rounded-xl' />
          <Skeleton className='w-full h-[100px] mt-5 rounded-xl' />
        </div>
        :
        <div className='p-5 border-4 rounded-2xl'>
          {(courseDetail?.chapters as any[])?.map((chapter, index) => (
            <Accordion type="single" collapsible key={index}>
              <AccordionItem value="item-1">
                <AccordionTrigger className='p-3 hover:bg-zinc-800 font-game text-3xl'>
                  <div className='flex items-center justify-between w-full '>
                    <div className='flex gap-10'>
                      <h2 className='h-10 w-10 bg-zinc-800 rounded-full
                        flex items-center justify-center'>{index + 1}</h2>
                      <h2>{chapter?.name}</h2>
                    </div>
                    {!hasUnlimitedAccess && index >= 3 && <h2 className='font-game text-3xl text-yellow-400'>Pro</h2>}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className='p-7 bg-zinc-900 rounded-2xl'>
                    {chapter?.exercises.map((exc: any, indexExc: number) => (
                      <div key={indexExc} className='flex items-center justify-between mb-7'>
                        <div className='flex items-center gap-10'>
                          <h2 className='text-xl font-game'>Exercise {index * chapter?.exercises?.length + indexExc + 1}</h2>
                          <h2 className='text-xl font-game'>{exc?.name}</h2>
                        </div>

                        {isExerciseCompleted(chapter?.chapterId, indexExc + 1) ?
                          <Button variant={'pixel'} className='bg-green-600'>Completed</Button> :
                          (courseDetail?.userEnrolled && (!hasUnlimitedAccess && index < 3)) ?
                            <Link href={'/courses/' + courseDetail?.courseId + '/' + chapter?.chapterId + '/' + exc?.slug}>
                              <Button variant={'pixel'}>{exc?.xp} xp</Button>
                            </Link> :
                            hasUnlimitedAccess && courseDetail?.userEnrolled ?
                              <Link href={'/courses/' + courseDetail?.courseId + '/' + chapter?.chapterId + '/' + exc?.slug}>
                                <Button variant={'pixel'}>{exc?.xp} xp</Button>
                              </Link> :
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant={'pixelDisabled'}>???</Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className='font-game text-lg'>Please Enroll First</p>
                                </TooltipContent>
                              </Tooltip>}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>}
    </div>
  )
}

export default CourseChapters