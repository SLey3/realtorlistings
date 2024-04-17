import React from 'react';
import Tags from "../assets/tagify/src/react.tagify";
import '../assets/tagify/dist/tagify.css';


interface TagInputProps {
  id: string,
  handleChange: CallableFunction,
  value: any[]
  classes?: string
  disabled?: boolean
}


const TagInput: React.FC<TagInputProps> = ({ id, handleChange, value, classes="", disabled=false }) => {
  return (
    <Tags value={value} whitelist={["apartment", "office", "house", "townhouse", "sale", "sold", "rent", "urban", "suburban", "rural", "town", "city", "farm", "industrial", "store"]}
      settings={{
        id: { id },
        enforceWhitelist: true,
        originalInputValueFormat: (valuesArr: any[]) => valuesArr.map((item) => item.value).join(","),
        dropdown: {
          enabled: 0 // always show suggestions dropdown
        }
      }} defaultValue=" " onChange={(e) => {handleChange(e)}} className={classes} disabled={disabled} />

  )
}


export default TagInput;