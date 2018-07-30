import React, { Component } from 'react';
import { Icon, Button } from 'choerodon-ui';
import DataLog from './DataLog';

const PROP = {
  Sprint: '冲刺',
  status: '状态',
  resolution: '',
  'Story Points': '故事点',
};

class DataLogs extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      user: {},
      expand: false,
    };
  }

  componentDidMount() {
  }

  setUser(user) {
    this.setState({
      user,
    });
  }

  render() {
    const { datalogs } = this.props;
    return (
      <div>
        {
          datalogs.map((datalog, i) => (
            <DataLog
              i={i}
              datalog={datalog}
              origin={datalogs}
              expand={this.state.expand}
              user={this.state.user}
              callback={this.setUser.bind(this)}
            />
          ))
        }
        {
          datalogs.length > 5 && !this.state.expand ? (
            <div style={{ marginTop: 5 }}>
              <Button className="leftBtn" funcTyp="flat" onClick={() => this.setState({ expand: true })}>
                <Icon type="baseline-arrow_drop_down icon" style={{ marginRight: 2 }} />
                <span>展开</span>
              </Button>
            </div>
          ) : null
        }
        {
          datalogs.length > 5 && this.state.expand ? (
            <div style={{ marginTop: 5 }}>
              <Button className="leftBtn" funcTyp="flat" onClick={() => this.setState({ expand: false })}>
                <Icon type="baseline-arrow_drop_up icon" style={{ marginRight: 2 }} />
                <span>折叠</span>
              </Button>
            </div>
          ) : null
        }
      </div>
    );
  }
}

export default DataLogs;