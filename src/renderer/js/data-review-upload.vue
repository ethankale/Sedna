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
  
  data: function() {
    return {
      QualifierID: 'None',
      Depth_M:     'None',
      Duplicate:   'None',
      LabBatch:    'None',
      Symbol:      'None',
      Note:        'None'
    }
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
          <td>Qualifier ID</td>
          <td>
            <select v-model="QualifierID">
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Depth (meters)</td>
          <td>
            <select v-model="Depth_M">
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Duplicate</td>
          <td>
            <select v-model="Duplicate">
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Lab Batch</td>
          <td>
            <select v-model="LabBatch">
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Symbol</td>
          <td>
            <select v-model="Symbol">
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Note</td> 
          <td>
            <select v-model="Note">
              <option v-for="field in fieldsForSelect">{{ field }}</option>
            </select>
          </td>
        </tr>
      </tbody>
      
    </table>
  </div>
</template>