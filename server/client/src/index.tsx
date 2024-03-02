import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, BrowserRouter } from 'react-router-dom'

import './index.css';

import { Index } from './pages/Index/Index'
import { Game } from './pages/Game/Game'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<Index />} />
      <Route path='/room/:params' element={<Game />} />
    </Routes>
  </BrowserRouter>
);