import React,{createContext,memo,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {BackHandler,StyleSheet,View} from 'react-native';
import Toast from '../feedback/Toast';
import Dim from './Dim';

const DEFAULT_TOAST_DURATION=3000;
const GlobalOverlayContext=createContext(null);

const GlobalOverlayProvider=({children})=>{
  const[overlay,setOverlay]=useState(null);
  const[toast,setToast]=useState({
    visible:false,
    message:'',
    buttonText:null,
    onPressButton:null,
    bottomOffset:0,
  });
  const overlayRef=useRef(null);
  const toastTimerRef=useRef(null);

  const openOverlay=useCallback(({
    id,
    renderContent,
    contentContainerStyle,
    dimStyle,
    showDim=true,
    closeOnDimPress=true,
    closeOnBackPress=true,
    accessibilityLabel='배경 닫기',
    onClose,
  })=>{
    if(!id){
      console.warn('GlobalOverlay의 id가 필요합니다.');
      return;
    }
    if(typeof renderContent!=='function'){
      console.warn('GlobalOverlay의 renderContent가 필요합니다.');
      return;
    }
    const nextOverlay={
      id,
      renderContent,
      contentContainerStyle,
      dimStyle,
      showDim,
      closeOnDimPress,
      closeOnBackPress,
      accessibilityLabel,
      onClose,
    };
    overlayRef.current=nextOverlay;
    setOverlay(nextOverlay);
  },[]);

  const closeOverlay=useCallback(id=>{
    const currentOverlay=overlayRef.current;
    if(!currentOverlay)return;
    if(id&&currentOverlay.id!==id)return;
    overlayRef.current=null;
    setOverlay(null);
    currentOverlay.onClose?.();
  },[]);

  const clearToastTimer=useCallback(()=>{
    if(!toastTimerRef.current)return;
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current=null;
  },[]);

  const hideToast=useCallback(()=>{
    clearToastTimer();
    setToast(previous=>({
      ...previous,
      visible:false,
    }));
  },[clearToastTimer]);

  const showToast=useCallback(({
    message,
    duration=DEFAULT_TOAST_DURATION,
    buttonText=null,
    onPressButton=null,
    bottomOffset=0,
  })=>{
    if(!message){
      console.warn('Toast의 message가 필요합니다.');
      return;
    }
    clearToastTimer();
    setToast({
      visible:true,
      message,
      buttonText,
      onPressButton,
      bottomOffset,
    });
    toastTimerRef.current=setTimeout(()=>{
      setToast(previous=>({
        ...previous,
        visible:false,
      }));
      toastTimerRef.current=null;
    },duration);
  },[clearToastTimer]);

  const handlePressToastButton=useCallback(()=>{
    const onPressButton=toast.onPressButton;
    hideToast();
    onPressButton?.();
  },[hideToast,toast.onPressButton]);

  useEffect(()=>{
    if(!overlay||!overlay.closeOnBackPress)return undefined;
    const subscription=BackHandler.addEventListener(
      'hardwareBackPress',
      ()=>{
        closeOverlay(overlay.id);
        return true;
      },
    );
    return()=>{
      subscription.remove();
    };
  },[closeOverlay,overlay]);

  useEffect(()=>{
    return()=>{
      clearToastTimer();
    };
  },[clearToastTimer]);

  const handlePressDim=useCallback(()=>{
    if(!overlay?.closeOnDimPress)return;
    closeOverlay(overlay.id);
  },[closeOverlay,overlay]);

  const isOverlayOpen=useCallback(id=>{
    return overlayRef.current?.id===id;
  },[]);

  const contextValue=useMemo(()=>({
    activeOverlayId:overlay?.id??null,
    openOverlay,
    closeOverlay,
    isOverlayOpen,
    showToast,
    hideToast,
  }),[
    closeOverlay,
    hideToast,
    isOverlayOpen,
    openOverlay,
    overlay?.id,
    showToast,
  ]);

  return(
    <GlobalOverlayContext.Provider value={contextValue}>
      <View style={styles.root}>
        {children}
        {overlay&&(
          <View
            pointerEvents={overlay.showDim?'auto':'box-none'}
            accessibilityViewIsModal={overlay.showDim}
            style={styles.overlay}
          >
            {overlay.showDim&&(
              <Dim
                visible
                onPress={overlay.closeOnDimPress?handlePressDim:undefined}
                accessibilityLabel={overlay.accessibilityLabel}
                style={overlay.dimStyle}
              />
            )}
            <View pointerEvents="box-none" style={styles.contentLayer}>
              <View
                pointerEvents="box-none"
                style={[
                  styles.contentContainer,
                  overlay.contentContainerStyle,
                ]}
              >
                {overlay.renderContent({
                  close:()=>closeOverlay(overlay.id),
                })}
              </View>
            </View>
          </View>
        )}
        {toast.visible&&(
          <View
            pointerEvents="box-none"
            style={[
              styles.toastLayer,
              {bottom:toast.bottomOffset},
            ]}
          >
            <Toast
              text={toast.message}
              buttonText={toast.buttonText}
              onPressButton={
                toast.buttonText
                  ?handlePressToastButton
                  :undefined
              }
            />
          </View>
        )}
      </View>
    </GlobalOverlayContext.Provider>
  );
};

const useGlobalOverlay=()=>{
  const context=useContext(GlobalOverlayContext);
  if(!context){
    throw new Error(
      'useGlobalOverlay는 GlobalOverlayProvider 안에서 사용해야 합니다.',
    );
  }
  return context;
};

const styles=StyleSheet.create({
  root:{
    flex:1,
    position:'relative',
  },
  overlay:{
    ...StyleSheet.absoluteFillObject,
    zIndex:999,
    elevation:999,
  },
  contentLayer:{
    ...StyleSheet.absoluteFillObject,
    zIndex:1,
    elevation:1,
  },
  contentContainer:{
    position:'absolute',
  },
  toastLayer:{
    position:'absolute',
    left:0,
    right:0,
    width:'100%',
    zIndex:1000,
    elevation:1000,
  },
});

export{useGlobalOverlay};
export default memo(GlobalOverlayProvider);