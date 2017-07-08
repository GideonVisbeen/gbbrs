import React from 'react';

class IconPage extends React.Component {
  constructor() {
    super();
    //bind all methods to this
  }
	render() {
		return (
			<div className="iconPage">
				<icon></icon>
				<p>Workflow for</p>
				Gulp, Browserify, Babel, React and Sass
			</div>
		);
	}
}

export default IconPage;