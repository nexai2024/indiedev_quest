import React from 'react'
import { courseExercise } from '../page'
import { Skeleton } from '@/components/ui/skeleton'
import { Book, Lightbulb, Target } from 'lucide-react'

type Props={
    courseExerciseData:courseExercise | undefined,
    loading:boolean
}

function ContentSection({courseExerciseData,loading}:Props) {
    const ContentInfo=courseExerciseData?.exerciseData;
  return (
    <div className='p-8 mb-28'>
        {loading || !ContentInfo?
        <Skeleton className='h-full w-full m-10 rounded-2xl'/>
        :
        <div>
            <h2 className='font-game my-3 text-4xl flex gap-2 items-center text-blue-400'> <Book/> {courseExerciseData?.exerciseData?.exerciseName}</h2>
        <div dangerouslySetInnerHTML={{__html:ContentInfo?.exerciseContent?.content}} />

        <div>
            <h2 className='font-game text-3xl mt-4 flex gap-2 items-center text-green-500'><Target/> Task</h2>
            <div className='p-4 border rounded-2xl bg-zinc-800' dangerouslySetInnerHTML={{__html:ContentInfo?.exerciseContent?.task}}/>
        </div>

        <div>
            <h2 className='font-game text-3xl mt-4 flex gap-2 items-center text-yellow-400'><Lightbulb/> Hint</h2>
            <div className='p-4 border rounded-2xl bg-zinc-800' dangerouslySetInnerHTML={{__html:ContentInfo?.exerciseContent?.hint}}/>
        </div>


        </div>
        }
    </div>
  )
}

export default ContentSection
