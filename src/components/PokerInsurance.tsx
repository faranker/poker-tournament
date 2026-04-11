// Poker Tournament Timer (Browser Version)
// React + styled-components
// Full Feature Version
// import { useState, useEffect } from "react";
import styled from "styled-components";

const Card = styled.div`
  background: #141414;
  border-radius: 14px;
  padding: 16px;

  label {
    display: block;
    margin-top: 12px;
    margin-bottom: 4px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 8px 0 12px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
`;

const Button = styled.button`
  background: #e50914;
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  margin-right: 8px;

  &:hover { opacity: .9 }
`;

const Title = styled.h2`
  font-size: 18px;
  margin-bottom: 12px;
`;


export default function PokerInsurance() {
  const calculate = () => {
    const pot = parseFloat((document.getElementById("pot") as HTMLInputElement).value);
    const outs = parseFloat((document.getElementById("outs") as HTMLInputElement).value);
    // const street = (document.getElementById("street") as HTMLSelectElement).value;
    if (isNaN(pot) || isNaN(outs)) {
      alert("กรุณากรอกข้อมูลให้ถูกต้อง");
      return;
    }
  }
    return (
      <div>
        <Card>
          <Title>คำนวณ Insurance Poker</Title>

        <label>Pot</label>
        <Input type="number" id="pot" placeholder="เช่น 1000" />

        <label>Outs</label>
        <Input type="number" id="outs" placeholder="เช่น 9" />

        <label>Street</label>
        <select id="street">
          <option value="turn">Turn (เหลือ 2 ใบ)</option>
          <option value="river">River (เหลือ 1 ใบ)</option>
        </select>

        <Button onClick={calculate}>Calculate</Button>

        <div className="result" id="result"></div>
      </Card>
      </div>
    );
}

