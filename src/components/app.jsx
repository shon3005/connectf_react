/**
 * @author zacharyjuang
 */
import React from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import {Collapse, Nav, Navbar, NavbarBrand, NavbarToggler} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import About from './about';
import Datagrid from './datagrid';
import QueryBuilder from './querybuilder';
import Cytoscape from './cytoscape';
import Feedback from './feedback';
import Tutorial from './tutorial';
import {NavItem} from "./common";
// import UploadAnalysis from './upload_analysis';
// import UploadExperiment from './upload_experiment';

/**
 * Main app component
 */
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  render() {
    return <div>
      <Navbar color="light" light expand="md">
        <NavbarBrand><FontAwesomeIcon icon="dna" className="mr-1"/>TF2TargetDB</NavbarBrand>
        <NavbarToggler onClick={this.toggle.bind(this)}/>
        <Collapse isOpen={this.state.isOpen} navbar>
          <Nav className="ml-auto" navbar>
            <NavItem to={"/"}>About</NavItem>
            <NavItem to={"/tutorial"}>Tutorial</NavItem>
            <NavItem to={"/query"}>Query</NavItem>
            {/*<NavItem active={pathname === "/upload_experiment"}>*/}
            {/*<Link to="/upload_experiment" className="nav-link">Upload Experiment</Link>*/}
            {/*</NavItem>*/}
            {/*<NavItem active={pathname === "/upload_analysis"}>*/}
            {/*<Link to="/upload_analysis" className="nav-link">Upload Analysis</Link>*/}
            {/*</NavItem>*/}
            <NavItem to={"/feedback"}>Feedback</NavItem>
          </Nav>
        </Collapse>
      </Navbar>
      <Switch>
        <Route exact path="/" component={About}/>
        <Route path="/tutorial" component={Tutorial}/>
        <Route path="/query" component={QueryBuilder}/>
        {/*<Route path="/upload_analysis" component={UploadAnalysis}/>*/}
        {/*<Route path="/upload_experiment" component={UploadExperiment}/>*/}
        <Route path="/feedback" component={Feedback}/>
        <Route path="/cytoscape" component={Cytoscape}/>
        <Route path="/datagrid" component={Datagrid}/>
        <Redirect to="/"/>
      </Switch>
    </div>;
  }
}

export default App;
