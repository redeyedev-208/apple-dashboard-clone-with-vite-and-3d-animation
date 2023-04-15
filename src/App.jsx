import React, { useRef } from "react";
import Loader from "./components/Loader";
import Nav from "./components/Nav";
import Jumbotron from "./components/Jumbotron";
import SoundSection from "./components/SoundSection";
import DisplaySection from "./components/DisplaySection";
import WebgiViewer from "./components/WebgiViewer";
function App() {
  const webgiViewerRef = useRef();

  const contentRef = useRef();

  // Let's create a function that is triggered from the display section
  const handlePreview = () => {
    webgiViewerRef.current.triggerPreview();
  };
  return (
    <div className="App">
      <Loader />
      <div ref={contentRef} id="content">
        <Nav />
        <Jumbotron />
        <SoundSection />
        <DisplaySection triggerPreview={handlePreview} />
      </div>
      <WebgiViewer contentRef={contentRef} ref={webgiViewerRef} />
    </div>
  );
}

export default App;
