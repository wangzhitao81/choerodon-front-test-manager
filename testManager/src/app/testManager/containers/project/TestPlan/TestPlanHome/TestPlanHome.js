import React, { Component } from 'react';
import Moment from 'moment';
import { observer } from 'mobx-react';
import { extendMoment } from 'moment-range';
import { Page, Header, Content } from 'choerodon-front-boot';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import {
  Tooltip, Button, Icon, Spin, Modal,
} from 'choerodon-ui';
import { Link } from 'react-router-dom';
import { editExecuteDetail, deleteExecute } from '../../../../api/cycleApi';
import { getStatusList } from '../../../../api/TestStatusApi';
import { getPrioritys } from '../../../../api/agileApi';
import {
  EventCalendar, CreateCycle, EditStage, EditCycle, ExportSide, TreeArea,
} from '../../../../components/TestPlanComponent';
import {
  RichTextShow, SelectFocusLoad, StatusTags, DragTable, SmartTooltip, Injecter,
} from '../../../../components/CommonComponent';
import { renderPriority } from '../../../../components/IssueManageComponent/IssueTable/tags';
import { getUsers } from '../../../../api/IamApi';
import TestPlanStore from '../../../../store/project/TestPlan/TestPlanStore';
import {
  delta2Html, delta2Text, issueLink, executeDetailShowLink,
} from '../../../../common/utils';
import RunWhenProjectChange from '../../../../common/RunWhenProjectChange';
import './TestPlanHome.scss';
import noRight from '../../../../assets/testPlanEmpty.svg';

const { confirm } = Modal;
const moment = extendMoment(Moment);

@observer
class TestPlanHome extends Component {
  state = {
    CreateCycleVisible: false,
    statusList: [],
    prioritys: [],
  }

  componentDidMount() {
    RunWhenProjectChange(TestPlanStore.clearStore);
    TestPlanStore.setFilters({});
    TestPlanStore.setAssignedTo(null);
    TestPlanStore.setLastUpdatedBy(null);
    this.refresh();
  }

  saveRef = name => (ref) => {
    this[name] = ref;
  }

  refresh = () => {
    Promise.all([getStatusList('CYCLE_CASE'), getPrioritys()]).then(([statusList, prioritys]) => {
      this.setState({ statusList, prioritys });
    });

    TestPlanStore.getTree();
  }

  handleItemClick = (item) => {
    const { type } = item;
    if (type === 'folder') {
      TestPlanStore.EditStage(item);
    } else if (type === 'cycle') {
      TestPlanStore.EditCycle(item);
    }
  }

  /**
   * 点击table的一项
   *
   * @memberof TestPlanHome
   */
  handleTableRowClick=(record) => {
    const { history } = this.props;
    history.push(executeDetailShowLink(record.executeId));
  }

  handleExecuteTableChange = (pagination, filters, sorter, barFilters) => {
    // window.console.log(pagination, filters, sorter);
    const Filters = { ...filters };
    if (barFilters && barFilters.length > 0) {
      Filters.summary = barFilters;
    }
    if (pagination.current) {
      TestPlanStore.setFilters(Filters);
      TestPlanStore.rightEnterLoading();
      TestPlanStore.setExecutePagination(pagination);
      TestPlanStore.reloadCycle();
    }
  }

  onDragEnd = (sourceIndex, targetIndex) => {
    let lastRank = null;
    let nextRank = null;
    const { testList } = TestPlanStore;
    if (sourceIndex < targetIndex) {
      lastRank = testList[targetIndex].rank;
      nextRank = testList[targetIndex + 1] ? testList[targetIndex + 1].rank : null;
    } else if (sourceIndex > targetIndex) {
      lastRank = testList[targetIndex - 1] ? testList[targetIndex - 1].rank : null;
      nextRank = testList[targetIndex].rank;
    }
    // window.console.log(sourceIndex, targetIndex, lastRank, nextRank);
    const source = testList[sourceIndex];
    const temp = { ...source };
    delete temp.defects;
    delete temp.caseAttachment;
    delete temp.testCycleCaseStepES;
    delete temp.issueInfosDTO;
    temp.assignedTo = temp.assignedTo || 0;
    TestPlanStore.rightEnterLoading();
    editExecuteDetail({
      ...temp,
      ...{
        lastRank,
        nextRank,
      },
    }).then((res) => {
      TestPlanStore.reloadCycle();
    }).catch((err) => {
      Choerodon.prompt('网络错误');
      TestPlanStore.rightLeaveLoading();
    });
  }

  deleteExecute = (record) => {
    const { executeId } = record;
    confirm({
      width: 560,
      title: Choerodon.getMessage('确认删除吗?', 'Confirm delete'),
      content: Choerodon.getMessage('当你点击删除后，该条数据将被永久删除，不可恢复!', 'When you click delete, after which the data will be permanently deleted and irreversible!'),
      onOk: () => {
        TestPlanStore.rightEnterLoading();
        deleteExecute(executeId)
          .then((res) => {           
            TestPlanStore.reloadCycle();
          }).catch((err) => {
            console.log(err);
            Choerodon.prompt('网络异常');
            TestPlanStore.rightLeaveLoading();
          });
      },
      okText: '删除',
      okType: 'danger',
    });
  }

  render() {
    const { CreateCycleVisible, statusList, prioritys } = this.state;
    const {
      testList, executePagination, loading, rightLoading,
    } = TestPlanStore;
    const columns = [{
      title: <span>ID</span>,
      dataIndex: 'issueNum',
      key: 'issueNum',
      flex: 1,
      // filters: [],
      // onFilter: (value, record) => 
      //   record.issueInfosDTO && record.issueInfosDTO.issueNum.indexOf(value) === 0,  
      render(issueId, record) {
        const { issueInfosDTO } = record;
        return (
          issueInfosDTO && (
            <Tooltip
              title={(
                <div>
                  <div>{issueInfosDTO.issueNum}</div>
                  {/* <div>{issueInfosDTO.summary}</div> */}
                </div>
              )}
            >
              <Link
                className="c7ntest-text-dot"
                style={{
                  width: 100,
                }}
                to={issueLink(issueInfosDTO.issueId, issueInfosDTO.typeCode, issueInfosDTO.issueNum)}
                target="_blank"
              >
                {issueInfosDTO.issueNum}
              </Link>
            </Tooltip>
          )
        );
      },
    }, {
      title: <span>用例名称</span>,
      dataIndex: 'summary',
      key: 'summary',
      filters: [],
      flex: 2,
      render(issueId, record) {
        const { issueInfosDTO } = record;
        return (
          issueInfosDTO && (
            <SmartTooltip>
              {issueInfosDTO.summary}
            </SmartTooltip>
          )
        );
      },
    }, 
    // {
    //   title: <FormattedMessage id="bug" />,
    //   dataIndex: 'defects',
    //   key: 'defects',
    //   flex: 1,
    //   render: defects => (
    //     <Tooltip
    //       placement="topLeft"
    //       title={(
    //         <div>
    //           {defects.map((defect, i) => (
    //             defect.issueInfosDTO && (
    //               <div>
    //                 <Link
    //                   style={{
    //                     color: 'white',
    //                   }}
    //                   to={issueLink(defect.issueInfosDTO.issueId, defect.issueInfosDTO.typeCode, defect.issueInfosDTO.issueNum)}
    //                   target="_blank"
    //                 >
    //                   {defect.issueInfosDTO.issueNum}
    //                 </Link>
    //                 <div>{defect.issueInfosDTO.summary}</div>
    //               </div>
    //             )
    //           ))}
    //         </div>
    //       )}
    //     >
    //       {defects.map((defect, i) => defect.issueInfosDTO && defect.issueInfosDTO.issueNum).join(',')}
    //     </Tooltip>
    //   ),
    // },
    {
      title: <FormattedMessage id="cycle_executeBy" />,
      dataIndex: 'lastUpdateUser',
      key: 'lastUpdateUser',
      flex: 1,
      render(lastUpdateUser) {
        return (
          <div
            className="c7ntest-text-dot"
          >
            {lastUpdateUser && lastUpdateUser.realName}
          </div>
        );
      },
    },
    //  {
    //   title: <FormattedMessage id="cycle_executeTime" />,
    //   dataIndex: 'lastUpdateDate',
    //   key: 'lastUpdateDate',
    //   flex: 1,
    //   render(lastUpdateDate) {
    //     return (
    //       <div
    //         className="c7ntest-text-dot"
    //       >
    //         {lastUpdateDate && moment(lastUpdateDate).format('YYYY-MM-DD')}
    //       </div>
    //     );
    //   },
    // },
    {
      title: <FormattedMessage id="cycle_assignedTo" />,
      dataIndex: 'assigneeUser',
      key: 'assigneeUser',
      flex: 1,
      render(assigneeUser) {
        return (
          <div
            className="c7ntest-text-dot"
          >
            {assigneeUser && assigneeUser.realName}
          </div>
        );
      },
    }, {
      title: <span>用例优先级</span>,
      dataIndex: 'priorityId',
      key: 'priorityId',
      filters: prioritys.map(priority => ({ text: priority.name, value: priority.id.toString() })),
      flex: 1,
      render(issueId, record) {
        const { issueInfosDTO } = record;
        return (
          issueInfosDTO && renderPriority(issueInfosDTO.priorityDTO)
        );
      },
    }, {
      title: <FormattedMessage id="status" />,
      dataIndex: 'executionStatus',
      key: 'executionStatus',
      filters: statusList.map(status => ({ text: status.statusName, value: status.statusId.toString() })),
      // onFilter: (value, record) => record.executionStatus === value,  
      flex: 1,
      render(executionStatus) {
        const statusColor = _.find(statusList, { statusId: executionStatus })
          ? _.find(statusList, { statusId: executionStatus }).statusColor : '';
        return (
          _.find(statusList, { statusId: executionStatus }) && (
            <StatusTags
              color={statusColor}
              name={_.find(statusList, { statusId: executionStatus }).statusName}
            />
          )
        );
      },
    }, 
    // {
    //   title: <span>执行描述</span>,
    //   dataIndex: 'comment',
    //   key: 'comment',
    //   filters: [],
    //   flex: 1,
    //   render(comment) {
    //     return (
    //       <Tooltip title={<RichTextShow data={delta2Html(comment)} />}>
    //         <div
    //           className="c7ntest-text-dot"
    //         >
    //           {delta2Text(comment)}
    //         </div>
    //       </Tooltip>
    //     );
    //   },
    // },
    {
      title: '',
      key: 'action',
      flex: 1,
      render: (text, record) => (
        record.projectId !== 0
        && (
          <div style={{ display: 'flex' }}>
            {/* <Tooltip title="跳转至执行详情">
              <Button
                shape="circle"
                funcType="flat"
                icon="explicit2"
                onClick={() => {
                  const { history } = this.props;
                  history.push(executeDetailShowLink(record.executeId));
                }}
              />
            </Tooltip> */}
            <div className="c7ntest-flex-space" />
            <Button
              shape="circle"
              funcType="flat"
              icon="delete_forever"
              style={{
                marginRight: 10,
              }}
              onClick={() => {
                this.deleteExecute(record);
              }}
            />
          </div>
        )
      ),
    }];

    return (
      <Page className="c7ntest-TestPlan">
        <Header title={<FormattedMessage id="testPlan_name" />}>
          <Button onClick={() => { this.setState({ CreateCycleVisible: true }); }}>
            <Icon type="playlist_add icon" />
            <FormattedMessage id="cycle_create_title" />
          </Button>
          <Button className="leftBtn" onClick={() => this.ExportSide.open()}>
            <Icon type="export icon" />
            <FormattedMessage id="export" />
          </Button>
          <Button onClick={this.refresh}>
            <Icon type="autorenew icon" />
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content
          title={null}
          description={null}
          style={{ padding: 0, display: 'flex' }}
        >
          <Spin spinning={loading}>
            <div className="c7ntest-TestPlan-content">
              <Injecter store={TestPlanStore} item="EditCycleVisible">
                {visible => <EditCycle visible={visible} />}
              </Injecter>
              <Injecter store={TestPlanStore} item="EditStageVisible">
                {visible => <EditStage visible={visible} />}
              </Injecter>
              <CreateCycle
                visible={CreateCycleVisible}
                onCancel={() => { this.setState({ CreateCycleVisible: false }); }}
                onOk={() => { this.setState({ CreateCycleVisible: false }); this.refresh(); }}
              />
              <ExportSide ref={this.saveRef('ExportSide')} />
              <Injecter store={TestPlanStore} item="isTreeVisible">
                {isTreeVisible => <TreeArea isTreeVisible={isTreeVisible} setIsTreeVisible={TestPlanStore.setIsTreeVisible} />}
              </Injecter>
              <Injecter store={TestPlanStore} item={['currentCycle', 'times', 'calendarShowMode', 'getTimesLength']}>
                {([currentCycle, times, calendarShowMode, getTimesLength]) => (currentCycle.key && getTimesLength ? (
                  <div className="c7ntest-TestPlan-content-right">
                    <EventCalendar key={currentCycle.key} showMode={calendarShowMode} times={times} onItemClick={this.handleItemClick} />
                    {calendarShowMode === 'single' && (
                      <div className="c7ntest-TestPlan-content-right-bottom">
                        <div style={{ display: 'flex', marginBottom: 20, alignItems: 'center' }}>
                          <div style={{
                            fontWeight: 600,                    
                            marginRight: 10,
                            fontSize: '14px',
                          }}
                          >
                            快速筛选:
                          </div>
                          <SelectFocusLoad
                            className="c7ntest-select"
                            placeholder={<FormattedMessage id="cycle_executeBy" />}
                            request={getUsers}
                            onChange={(value) => {
                              TestPlanStore.setLastUpdatedBy(value);
                              TestPlanStore.loadCycle();
                            }}
                          />                          
                          <SelectFocusLoad
                            style={{ marginLeft: 20, width: 200 }}
                            className="c7ntest-select"
                            placeholder={<FormattedMessage id="cycle_assignedTo" />}                              
                            request={getUsers}
                            onChange={(value) => {
                              TestPlanStore.setAssignedTo(value);
                              TestPlanStore.loadCycle();
                            }}
                          />                        
                        </div>
                        <DragTable
                          pagination={executePagination}
                          loading={rightLoading}
                          onChange={this.handleExecuteTableChange}
                          dataSource={testList}
                          columns={columns}
                          onDragEnd={this.onDragEnd}
                          onRow={record => ({
                            onClick: (event) => { this.handleTableRowClick(record); },                             
                          })}
                          dragKey="executeId"
                        />
                      </div>
                    )}
                  </div> 
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', height: 250, margin: '88px auto', padding: '50px 75px', border: '1px dashed rgba(0,0,0,0.54)',
                  }}
                  >
                    <img src={noRight} alt="" />
                    <div style={{ marginLeft: 40 }}>
                      <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.65)' }}>根据当前选定的测试循环没有查询到循环信息</div>
                      <div style={{ fontSize: '20px', marginTop: 10 }}>您可以创建测试循环并且进行计划</div>
                    </div>
                  </div>
                ))}
              </Injecter>
            </div>
          </Spin>
        </Content>
      </Page>
    );
  }
}

TestPlanHome.propTypes = {

};

export default TestPlanHome;
