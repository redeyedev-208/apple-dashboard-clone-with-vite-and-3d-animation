import React, {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollAnimation } from "../lib/scroll-animation";
import {
  ViewerApp,
  AssetManagerPlugin,
  GBufferPlugin,
  ProgressivePlugin,
  TonemapPlugin,
  SSRPlugin,
  SSAOPlugin,
  BloomPlugin,
  GammaCorrectionPlugin,
  mobileAndTabletCheck,
} from "webgi";

// We need to register the plugin that triggers the animation when scrolling
gsap.registerPlugin(ScrollTrigger);

const WebgiViewer = forwardRef((props, ref) => {
  {
    const canvasRef = useRef(null);
    const canvasContainerRef = useRef(null);

    const [viewerRef, setViewerRef] = useState(null);
    const [targetRef, setTargetRef] = useState(null);
    const [cameraRef, setCameraRef] = useState(null);
    const [positionRef, setPositionRef] = useState(null);
    const [previewMode, setPreviewMode] = useState(null);
    const [isMobile, setIsMobile] = useState(null);

    // This allows us to call the function from the parent the App.jsx file
    useImperativeHandle(ref, () => ({
      triggerPreview() {
        setPreviewMode(true);
        canvasContainerRef.current.style.pointerEvents = "all";
        props.contentRef.current.style.opacity = "0";
        gsap.to(positionRef, {
          x: 13.04,
          y: -2.01,
          z: 2.29,
          duration: 2,
          onUpdate: () => {
            viewerRef.setDirty(); // We are setting up the viewer for rendering
            cameraRef.positionTargetUpdated(true);
          },
        });

        gsap.to(targetRef, { x: 0.11, y: 0.0, z: 0.0, duration: 2 });

        // We need to enable the 3D model to be rotated
        // By doing this we will also need to present a way to exit
        // The preview mode
        viewerRef.scene.activeCamera.setCameraOptions({
          controlsEnabled: true,
        });
      },
    }));

    // Leaving the dependency array empty ensures we are only calling this once
    // This is specific to line 36
    const memoizedScrollAnimation = useCallback(
      (position, target, isMobile, onUpdate) => {
        if (position && target && onUpdate) {
          scrollAnimation(position, target, isMobile, onUpdate);
        }
      },
      []
    );

    // Gives the ability to cache the plugins so we aren't reloading the plugins
    const setupViewer = useCallback(async () => {
      // Initialize the viewer
      const viewer = new ViewerApp({
        canvas: canvasRef.current,
      });

      // We need to set our variables in order to trigger the "Try me" button correctly
      // Commenting out these lines will result in an undefined console warning
      setViewerRef(viewer);
      const isMobileOrTablet = mobileAndTabletCheck();
      setIsMobile(isMobileOrTablet);

      // Add some plugins
      const manager = await viewer.addPlugin(AssetManagerPlugin);

      // Setup our camera
      const camera = viewer.scene.activeCamera;
      const position = camera.position;
      const target = camera.target;

      // Assign the variables we have set as consts above
      // Comment out lines 87-89 to see the not defined error in the console
      setCameraRef(camera);
      setPositionRef(position);
      setTargetRef(target);

      // Add plugins individually.
      await viewer.addPlugin(GBufferPlugin);
      await viewer.addPlugin(new ProgressivePlugin(32));
      await viewer.addPlugin(new TonemapPlugin(true));
      await viewer.addPlugin(GammaCorrectionPlugin);
      await viewer.addPlugin(SSRPlugin);
      await viewer.addPlugin(SSAOPlugin);
      await viewer.addPlugin(BloomPlugin);

      // This must be called once after all plugins are added.
      viewer.renderer.refreshPipeline();

      await manager.addFromPath("scene-black.glb");

      viewer.getPlugin(TonemapPlugin).config.clipBackground = true;

      // This prevents users from rotating the display of the 3D image
      viewer.scene.activeCamera.setCameraOptions({ controlsEnabled: false });

      if (isMobileOrTablet) {
        position.set(-16.7, 1.17, 11.7);
        target.set(0, 1.37, 0);
        props.contentRef.current.className = "mobile-or-tablet";
      }

      // We want to set the position of the window to the top
      window.scrollTo(0, 0);

      // Use this for the condition to ensure the camera needs update
      let needsUpdate = true;

      const onUpdate = () => {
        needsUpdate = true;
        // This means that the camera and the viewer needs to be updated
        viewer.setDirty();
      };
      // Add an event listenere to the viewer
      viewer.addEventListener("preFrame", () => {
        if (needsUpdate) {
          camera.positionTargetUpdated(true);
          needsUpdate = false;
        }
      });
      memoizedScrollAnimation(position, target, isMobileOrTablet, onUpdate);
    }, []);

    useEffect(() => {
      setupViewer();
    }, []);

    // TODO: Left off at 1:30
    // https://www.youtube.com/watch?v=ZFGX29ZI52U&t=68s
    // We want to reset the state with this function
    // This is being set in the triggerPreview function
    const handleExitPreviewMode = useCallback(() => {
      canvasContainerRef.current.style.pointerEvents = "none";
      props.contentRef.current.style.opacity = "1";
      viewerRef.scene.activeCamera.setCameraOptions({
        controlsEnabled: false,
      });
      setPreviewMode(false);

      gsap.to(positionRef, {
        x: !isMobile ? 1.56 : 9.36,
        y: !isMobile ? 5.0 : 10.95,
        z: !isMobile ? 0.01 : 0.09,
        scrollTrigger: {
          trigger: ".display-section",
          start: "top bottom",
          end: "top top",
          scrub: 2,
          immediateRender: false,
        },
        onUpdate: () => {
          viewerRef.setDirty();
          cameraRef.positionTargetUpdated(true);
        },
      });
      gsap.to(targetRef, {
        x: !isMobile ? -0.55 : -1.62,
        y: !isMobile ? 0.32 : 0.02,
        z: !isMobile ? 0.0 : -0.06,
        scrollTrigger: {
          trigger: ".display-section",
          start: "top bottom",
          end: "top top",
          scrub: 2,
          immediateRender: false,
        },
      });
    }, [canvasContainerRef, viewerRef, positionRef, cameraRef, targetRef]);

    return (
      <div ref={canvasContainerRef} id="webgi-canvas-container">
        <canvas id="webgi-canvas" ref={canvasRef} />
        {previewMode && (
          <button className="button" onClick={handleExitPreviewMode}>
            Exit preview mode
          </button>
        )}
      </div>
    );
  }
});
// Wrap the forwardRef around all of this

export default WebgiViewer;
