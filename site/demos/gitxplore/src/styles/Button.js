import styled, { css } from 'react-emotion';

import { queries } from './mediaQueries';
import color from './theme';

const button = css`
	cursor: pointer;
	padding: 5px;
	margin: 5px;
	text-align: center;
	border-radius: 4px;
`;

export const ToggleButton = styled.div`
	${button};
	color: white;
	border: 1px solid white;
	display: none;
	max-width: 200px;
	font-size: 1.3rem;
	align-self: center;
	padding: 10px;
	margin-top: 10px;

	&:hover {
		background: white;
		color: ${color.secondaryColor};
	}

	${queries.xLarge`
		display: block;
	`};
`;

const Button = styled.div`
	${button};
	background: ${color.lightGray};
	min-width: 70px;

	svg {
		margin-right: 4px;
	}

	&:hover {
		background: ${color.primaryColor};
		color: white;
	}
`;

export default Button;
