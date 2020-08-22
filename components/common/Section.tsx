import React, { FC, ReactNode } from "react";
import styled from "styled-components";

const Container = styled.section<{ flexDirection: string }>`
  width: 912px;
  height: 100%;
  display: flex;
  flex-direction: ${props => props.flexDirection};
  margin: 0 auto;
  padding: 10px;
  padding-top: 5rem;

  ${props => props.theme.media.desktop} {
    width: 768px;
  }

  ${props => props.theme.media.tablet} {
    width: 100%;
  }
`;

interface Props {
  children: ReactNode | JSX.Element;
  flexDirection?: string;
}

const Section: FC<Props> = ({ children, flexDirection = "column" }) => (
  <Container flexDirection={flexDirection}>{children}</Container>
);

export default Section;
