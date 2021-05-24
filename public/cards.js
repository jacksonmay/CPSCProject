(async () => {
  
  var year = $("#year").val()
  
  function getData(year) {
    return new Promise((resolve, reject) => {
      $.getJSON(`https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=${year}&RecallDateEnd=${parseInt(year) + 1}`, function(result){
        var violations = []
        $.each(result, function(i, field){
          violations.push(result[i])
        })  
        console.log(year)
        resolve(violations)
      })
    })
  }
    
  let violations = await getData(year)
  console.log(violations)

  window.app = new Vue({
    el: '#vueApp',
    data: {
      violations : violations,
      year : year
    },
    methods: {
      imgSrc: function(x) {
        return this.violations[x].Images[0] ? this.violations[x].Images[0].URL : 'No_Image_Available.jpg'
      },
      description: function(x) {
        return this.violations[x] ? this.violations[x].Description : null
      },
      name: function(x) {
        return this.violations[x].Products[0] ? this.violations[x].Products[0].Name : null
      },
      id: function(x) {
        return this.violations[x] ? this.violations[x].RecallID : null
      },
      hazard: function(x) {
        return this.violations[x].Hazards[0] ? this.violations[x].Hazards[0].Name : null
      },
      updateYear : async function(e) {
        this.year = e.target.value
        let violations = await getData(e.target.value)
        this.violations.splice(0, this.violations.length)
        $.each(violations, (i, index) => {
          this.violations.push(violations[i])
        })      
      }
    }
  })
  
})()






