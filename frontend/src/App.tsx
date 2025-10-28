import './App.css';

import { MappingPage } from "@features/mapping";
import { BrowserRouter as Router, Route,Routes } from "react-router-dom";
import { Toaster } from 'sonner';

import { ExportsManagerPage } from "./features/exports-manager";

function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<MappingPage />} />
                    <Route path="/manage" element={<ExportsManagerPage />} />
                </Routes>
                <Toaster position="top-center" richColors />
            </Router>
        </>
    );
}

export default App;