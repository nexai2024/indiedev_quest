import React from 'react'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { courseExercise } from '../page';
import { Button } from '@/components/ui/button';
import { ResizableGroup, ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import { amethyst } from "@codesandbox/sandpack-themes";
import { useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

type Props={
    courseExerciseData:courseExercise | undefined,
    loading:boolean
}

const CodeEditorChildren=({onCompleteExercise,IsCompleted}: any)=>{

  const {sandpack} =  useSandpack();
  return(
    <div className='font-game absolute bottom-3 z-10 flex gap-5 right-3'>
      <Button variant={'pixel'} size={'lg'} className='text-xl' 
      onClick={()=>sandpack.runSandpack()}> Run Code </Button>
      <Button variant={'pixel'} className='bg-[#a3e534] text-xl' size={'lg'} 
      onClick={()=>onCompleteExercise()} 
      disabled={IsCompleted}
      > 
        {IsCompleted?'Already Comlpeted !' : 'Mark Completed!'}   </Button>
    </div>
  )
}


function CodeEditor({courseExerciseData,loading} : Props) {
  const {exerciseslug}=useParams();
  const exerciseIndex=courseExerciseData?.exercises?.findIndex(item=>item.slug==exerciseslug);//

  const IsCompleted=courseExerciseData?.completedExercise?.find(item=>item?.exerciseId==Number(exerciseIndex)+1);

  const onCompleteExercise= async()=>{
    
    if(exerciseIndex==undefined) return ;

    const result = await axios.post('/api/exercise/complete',{
      courseId:courseExerciseData?.courseId,
      chapterId:courseExerciseData?.chapterId,
      exerciseId:exerciseIndex+1,
      xpEarned:courseExerciseData?.exercises[exerciseIndex].xp
    })

    console.log(result);
    toast.success('Exercise Completed!!')
  }


  return (
    <div className='h-full '>
        <SandpackProvider 
        //@ts-ignore
        template={courseExerciseData?.editorType??'react'}
        theme={amethyst}
        style={{
            height:'100%'
        }}
        files={courseExerciseData?.exerciseData?.exerciseContent?.starterCode}
        options={{
          autorun:false,
          autoReload:false
        }}
        >
            <SandpackLayout style={{
                   height:'100%'
                }}>

                <ResizableGroup
                  id="sandpack-split"
                  panelIds={["sandpack-editor", "sandpack-preview"]}
                >
                 <ResizablePanel id="sandpack-editor" defaultSize="50%" minSize="30%" className='relative'>
                <SandpackCodeEditor 
                showTabs
                style={{
                   height:'100%'
                }}/>
                  <CodeEditorChildren
                  onCompleteExercise={onCompleteExercise}
                  IsCompleted={IsCompleted}/>
                  </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel id="sandpack-preview" defaultSize="50%" minSize="30%">
                <SandpackPreview 
                showNavigator
                showOpenInCodeSandbox={false}
                showOpenNewtab
                
                style={{
                   height:'100%'
                }}/>
                </ResizablePanel>
                </ResizableGroup>
            </SandpackLayout>
        </SandpackProvider>

        
    </div>
  )
}

export default CodeEditor
