import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {placeholder, totalFrames, type Cut, type VideoProps} from './model';
export const Root:React.FC=()=> <>{(['x','judge'] as Cut[]).map(cut=><Composition
  key={cut} id={cut==='x'?'XCut':'JudgeCut'} component={Film}
  width={1920} height={1080} fps={30} durationInFrames={totalFrames(cut)}
  defaultProps={{repoUrl:placeholder,audio:{},terminal:[],cut} as VideoProps}
  calculateMetadata={({props})=>({durationInFrames:totalFrames(props.cut,props.audio)})}
/>)}</>;
