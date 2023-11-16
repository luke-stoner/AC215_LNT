import React from "react";
import { Route, Switch, Redirect } from 'react-router-dom';
import Home from "../components/Home";

const AppRouter = (props) => {

  console.log("================================== AppRouter ======================================");

  return (
    <React.Fragment>
      <Switch>
        <Route path="/" exact component={Home} />
      </Switch>
    </React.Fragment>
  );
}

export default AppRouter;