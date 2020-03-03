import React from 'react'
import { connect } from 'react-redux'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'

import 'steps/ExtractData.css'


class ExtractData extends React.Component {
  extractAll = () => {
    const hext = this.props.hext;
    const documents = this.props.scrape.documents;
    return documents.map((doc) => {
      const html = doc.html;
      const parsedHtml = new window.Module.Html(html);
      const rule = new window.Module.Rule(hext);
      const results = rule.extract(parsedHtml);
      return results;
    }).filter(x => x).flat();
  }

  downloadJSON = () => {
    const records = this.extractAll();
    const strData = JSON.stringify(records);
    const blob = new Blob([strData]);
    const now = (new Date()).getTime();
    saveAs(blob, `autoscrape-data-${now}.json`)
  }

  downloadCSV = () => {
    const records = this.extractAll();
    const csv = Papa.unparse(records);
    const blob = new Blob([csv]);
    const now = (new Date()).getTime();
    saveAs(blob, `autoscrape-data-${now}.csv`)
  }

  render() {
    if (this.props.hext) {
      return (
        <div id="extract-data">
          <h1>Download Data</h1>
          <p>
            Click an output format below to download your extracted data.
          </p>
          <div className="downloads">
            <span className="json" onClick={this.downloadJSON}>
              <img src="/json-icon.svg" alt="Download Data (JSON)" />
            </span>
            <span className="csv" onClick={this.downloadCSV}>
              <img src="/csv-icon.svg" alt="Download Spreadsheet (CSV)" />
            </span>
          </div>
        </div>
      );
    }
    if (this.props.documents && !this.props.hext) {
      return (
        <div id="extract-data">
          <h2>This is where you'll download your extracted data</h2>
          <p>
            You haven't created an extractor, yet! Go back to the 'Build Extractor'
            step and build one first.
          </p>
        </div>
      );
    }
    return (
      <div id="extract-data">
        <h2>This is where you'll download your extracted data</h2>
        <p>
          You haven't completed a successful scrape, yet. Go back to
          the scraper section and do that first.
        </p>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { scrape, hext } = state;
  return { scrape, hext };
}

export default connect(mapStateToProps, {})(ExtractData);
