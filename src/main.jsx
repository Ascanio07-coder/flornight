import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Admin from './Admin'
import Staff from './Staff'

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null,
    React.createElement(BrowserRouter, null,
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/', element: React.createElement(App) }),
        React.createElement(Route, { path: '/admin', element: React.createElement(Admin) }),
        React.createElement(Route, { path: '/staff', element: React.createElement(Staff) })
      )
    )
  )
)