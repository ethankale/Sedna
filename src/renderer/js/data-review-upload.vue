<script>
let Papa       = require('papaparse');
let lx         = require('luxon');
let alqwuutils = require('./utils.js');

export default {
  props: {
    fields: [],
    SamplePointID: 0,
    datetimeField: '',
    valueField: '',
    dataToLoad: {}
  },
  
  computed: {
    fieldsForSelect: function() {
      return ["None"].concat(this.fields);
    }
  }
}
</script>

<template>
  <div>
    <br>
    <h5>Additional Fields</h5>
    
    <table class="table">
      <thead>
        <tr>
          <th scope="col">GData Field</th>
          <th scope="col">CSV Field</th>
        </tr>
      </thead>
      
      <tbody>
        <tr> 
          <td>QualifierID</td>
          <td>
            <select>
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Depth_M</td>
          <td>
            <select>
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Duplicate</td>
          <td>
            <select>
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>LabBatch</td>
          <td>
            <select>
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Symbol</td>
          <td>
            <select>
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Note</td> 
          <td>
            <select>
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
      </tbody>
      
    </table>
  </div>
</template>