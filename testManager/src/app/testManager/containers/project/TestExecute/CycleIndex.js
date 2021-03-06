import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const ComponentHome = asyncRouter(() => import('./TestExecuteHome'));
const ExecuteDetail = asyncRouter(() => import('./ExecuteDetail'));

const CycleIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={ComponentHome} />
    <Route exact path={`${match.url}/execute/:id?`} component={ExecuteDetail} />    
    <Route path="*" component={nomatch} />
  </Switch>
);

export default CycleIndex;
