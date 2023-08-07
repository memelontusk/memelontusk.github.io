import './App.css';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Home from './components/Home/Home'

function App() {
  return (
      <Router basename={process.env.PUBLIC_URL}>
        <div className="app h-100" style={{"backgroundColor": "rgb(244, 246, 248)"}}>
          <Switch>
            <Route exact path="/" component={Home}></Route>
          </Switch>
        </div>
      </Router>
  );
}

export default App;
