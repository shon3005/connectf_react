/**
 * @author zacharyjuang
 * 6/23/17
 */
import React from 'react';
import PropTypes from 'prop-types';
import cytoscape from 'cytoscape';
import {connect} from 'react-redux';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import DropZone from 'react-dropzone';
import {Popover, PopoverHeader, PopoverBody, Alert} from 'reactstrap';
import classNames from 'classnames';
import uuid4 from 'uuid/v4';

import {getCytoscape, setCytoscape} from '../../actions';

const edge_value = _.unary(_.partial(_.pick, _, ['data.source', 'data.target', 'data.name']));
const edge_compare = (s, o) => {
  return _.isEqual(edge_value(s), edge_value(o));
};

const mapStateToProps = (state) => {
  return {
    requestId: state.requestId,
    cytoscapeData: state.cytoscape
  };
};

class UploadSifInfoPopover extends React.Component {
  render() {
    return <Popover {...this.props}>
      <PopoverHeader>Upload Edges</PopoverHeader>
      <PopoverBody>
        <p>Accepts tab (<span className="text-monospace">&#34;\t&#34;</span>) delimited text file with 3 columns. In
          order: source, edge name, and target. <a target="_blank" rel="noopener noreferrer"
                                                   href="http://manual.cytoscape.org/en/stable/Supported_Network_File_Formats.html#sif-format">More
            info.</a>
        </p>
        <p>Only creates new edges on the current network. Does <b>not</b> create new nodes.</p>
        <p><a href={"data:text/plain,source1\tedge_name\ttarget1\nsource2\tedge_name\ttarget2\n...\t...\t...\n"}
              download="example.sif" className="btn btn-primary btn-sm">
          <FontAwesomeIcon icon="file-download" className="mr-1"/>Download Example File</a></p>
      </PopoverBody>
    </Popover>;
  }
}

class CytoscapeBody extends React.Component {
  constructor(props) {
    super(props);
    this.cyRef = React.createRef();

    this.state = {
      height: Math.floor(document.documentElement.clientHeight * 0.8),
      popoverOpen: false,
      busy: false,
      color: "#ffff00",
      alertOpen: false,
      alertMessage: ""
    };

    this.setHeight = _.debounce(this.setHeight.bind(this), 100);
    this.setUserEdgeColor = _.debounce(this.setUserEdgeColor.bind(this), 50, {maxWait: 200});
  }

  componentDidMount() {
    this.cy = cytoscape({
      container: this.cyRef.current,
      boxSelectionEnabled: false,
      autounselectify: true,
      style: [
        {
          selector: 'node',
          style: {
            'font-family': 'helvetica',
            'text-rotation': 270,
            'text-outline-color': '#000000',
            'text-valign': 'center',
            'color': '#000000',
            'shape': 'data(shape)',
            'background-color': 'data(color)',
            'width': 'data(size)',
            'height': 'data(size)'
          }
        },
        {
          selector: "node[showLabel = 'show']",
          style: {
            'content': function (ele) {
              let name = ele.data('name');
              if (!name) {
                return ele.data('id');
              }
              return `${ele.data('id')} (${ele.data('name')})`;
            }
          }
        },
        {
          selector: 'edge',
          style: {
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'data(color)',
            'curve-style': 'bezier',
            'line-color': 'data(color)'
          }
        }
      ],
      layout: {
        name: 'preset'
      }
    });

    this.cy.on('mouseover', 'edge', function (event) {
      let ele = event.target;
      ele.style({
        'label': ele.data('name'),
        'z-compound-depth': 'top'
      });
    });

    this.cy.on('mouseout', 'edge', function (event) {
      let ele = event.target;
      ele.removeStyle('label z-compound-depth');
    });

    this.cy.on('mouseover', "node[showLabel != 'show']", function (event) {
      let ele = event.target;
      ele.style({
        'content': function (ele) {
          let name = ele.data('name');
          if (!name) {
            return ele.data('id');
          }
          return `${ele.data('id')} (${ele.data('name')})`;
        }
      });
    });

    this.cy.on('mouseout', "node[showLabel != 'show']", function (event) {
      let ele = event.target;
      ele.style({'content': null});
    });

    this.setHeight();

    if (this.props.requestId) {
      this.props.getCytoscape(this.props.requestId);
    }

    window.addEventListener("resize", this.setHeight);
  }

  componentWillUnmount() {
    if (this.cy) {
      this.cy.destroy();
    }
    window.removeEventListener("resize", this.setHeight);
  }

  setHeight() {
    this.setState({height: document.documentElement.clientHeight - this.cyRef.current.offsetTop});
  }

  resetCytoscape() {
    if (!this.layout) {
      this.layout = this.cy.layout({
        name: 'preset'
      });
    }
    this.layout.run();
  }

  fitCytoscape() {
    this.cy.fit();
  }

  exportCytoscape(e) {
    e.currentTarget.download = 'query.png';
    e.currentTarget.href = this.cy.png();
  }

  exportJSON(e) {
    let {cytoscapeData} = this.props;

    let data = {
      "format_version": "1.0",
      "generated_by": "tf2targetdb",
      elements: {
        nodes: _.filter(cytoscapeData, ['group', 'nodes']),
        edges: _.filter(cytoscapeData, ['group', 'edges'])
      }
    };

    e.currentTarget.download = 'cytoscape.cyjs';
    e.currentTarget.href = 'data:application/json,' + JSON.stringify(data);
  }

  setData(data) {
    this.cy.batch(() => {
      this.cy.json({elements: data});
      this.resetCytoscape();
    });
  }

  componentDidUpdate(prevProp) {
    if (prevProp.requestId !== this.props.requestId) {
      this.props.getCytoscape(this.props.requestId);
    }

    if (prevProp.cytoscapeData !== this.props.cytoscapeData) {
      this.setData(this.props.cytoscapeData);
    }
  }

  back() {
    this.props.history.goBack();
  }

  togglePopover() {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    });
  }

  setBusy(busy) {
    this.setState({busy});
  }

  setColor(e) {
    this.setState({
      color: e.target.value
    });

    this.setUserEdgeColor(e.target.value);
  }

  setUserEdgeColor(color) {
    this.cy.$('edge[user]').data('color', color);
  }

  handleUpload(acceptedFiles, rejectedFiles) {
    if (rejectedFiles.length) {
      this.setAlertMessage("File type not accepted.");
    } else if (acceptedFiles.length) {
      let reader = new FileReader();

      reader.readAsText(acceptedFiles[0]);
      reader.onload = () => {
        this.handleEdges(reader.result);
      };
    }
  }

  handleEdges(text) {
    let {color} = this.state;
    this.setBusy(true);
    let res = _(text)
      .split("\n")
      .filter(_.negate(_.isEmpty))
      .map(_.trim)
      .map(_.unary(_.partial(_.split, _, '\t')))
      .map(_.unary(_.partial(_.map, _, _.trim)))
      .map(_.unary(_.partial(_.filter, _, _.negate(_.isEmpty))));

    if (res.some((o) => o.length < 3)) {
      this.setAlertMessage("Every row need to have at least 3 columns.");
      return;
    }

    let nodes = _.invokeMap(this.cy.$("node"), 'data', 'id');

    let edges = res
      .map(([s, e, ...ts]) => {
        return _.map(ts, (t) => {
          return {
            data: {
              id: uuid4(),
              source: s,
              target: t,
              name: e,
              color,
              user: true
            }
          };
        });
      })
      .flatten();

    let uniqExistEdges = edges
      .intersectionWith(nodes, (s, o) => {
        return _.toUpper(s.data.source) === _.toUpper(o);
      })
      .intersectionWith(edges
        .intersectionWith(nodes, (s, o) => {
          return _.toUpper(s.data.target) === _.toUpper(o);
        }).value(), edge_compare)
      .uniqWith(edge_compare).value();

    if (!uniqExistEdges.length) {
      this.setAlertMessage("No edges added.");
    } else {
      this.cy.add(uniqExistEdges);
    }

    this.setBusy(false);
  }

  toggleAlert() {
    this.setState({
      alertOpen: !this.state.alertOpen
    });
  }

  setAlertMessage(alertMessage, alertOpen = true) {
    this.setState({
      alertMessage,
      alertOpen
    });
  }

  render() {
    let {height, popoverOpen, busy, color, alertOpen, alertMessage} = this.state;

    return <div className="container-fluid">
      <Alert color="danger" isOpen={alertOpen} toggle={this.toggleAlert.bind(this)}>{alertMessage}</Alert>
      <div className="row">
        <div className="btn-toolbar m-1 col">
          <div className="btn-group mr-2">
            <button onClick={this.back.bind(this)} className="btn btn-warning">
              <FontAwesomeIcon icon="arrow-circle-left" className="mr-1"/>Back
            </button>
            <button className="btn btn-light" onClick={this.resetCytoscape.bind(this)}>
              <FontAwesomeIcon icon="redo" className="mr-1"/>Reset
            </button>
            <button className="btn btn-light" onClick={this.fitCytoscape.bind(this)}>
              <FontAwesomeIcon icon="expand" className="mr-1"/>Fit
            </button>
            <a className="btn btn-light" onClick={this.exportCytoscape.bind(this)}>
              <FontAwesomeIcon icon="image" className="mr-1"/>Export Image</a>
            <a className="btn btn-light" onClick={this.exportJSON.bind(this)}>
              <FontAwesomeIcon icon="file-download" className="mr-1"/>Download JSON</a>
          </div>
          <div className="input-group mr-2">
            <div className="input-group-prepend">
              <DropZone className={classNames("btn", !busy ? "btn-outline-primary" : "btn-outline-warning")}
                        accept={['text/*', '', '.sif', '.tsv']}
                        acceptClassName="btn-outline-success"
                        rejectClassName="btn-outline-danger" onDrop={this.handleUpload.bind(this)}>
                {!busy ? <span><FontAwesomeIcon icon="file-upload" className="mr-1"/>Upload Edges</span> :
                  <FontAwesomeIcon icon="circle-notch" spin className="mx-5"/>}</DropZone>
              <span className="input-group-text">Edge Color:</span>
            </div>
            <input type="color" className="form-control" style={{width: '80px'}} value={color}
                   onChange={this.setColor.bind(this)}/>
            <div className="input-group-append">
              <div className="btn btn-outline-dark" id="info" onClick={this.togglePopover.bind(this)}>
                <FontAwesomeIcon icon="info-circle"/>
              </div>
            </div>
            <UploadSifInfoPopover target="info" placement="right" isOpen={popoverOpen}
                                  toggle={this.togglePopover.bind(this)}/>
          </div>
        </div>
      </div>
      <div className="row" ref={this.cyRef} style={{height}}/>
    </div>;
  }
}

CytoscapeBody.propTypes = {
  history: PropTypes.object,
  requestId: PropTypes.string,
  cytoscapeData: PropTypes.array,
  getCytoscape: PropTypes.func,
  setCytoscape: PropTypes.func
};

const Cytoscape = connect(mapStateToProps, {getCytoscape, setCytoscape})(CytoscapeBody);

export default Cytoscape;
