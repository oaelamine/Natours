//REFACTURING TO CLASS
class APIfeaturs {
  constructor(query, querySTR) {
    this.query = query;
    this.querySTR = querySTR;
  }

  filter() {
    const queryObj = { ...this.querySTR };
    const execludedField = ['page', 'sort', 'limit', 'fields'];
    execludedField.forEach(item => delete queryObj[item]);

    //ADVANCED FILTERING
    let ADVqueryObj = JSON.stringify(queryObj);
    ADVqueryObj = ADVqueryObj.replace(
      /\b(gte|lte|gt|lt)\b/g,
      match => `$${match}`
    );

    // let query = Tour.find(JSON.parse(ADVqueryObj));
    this.query = this.query.find(JSON.parse(ADVqueryObj));

    return this;
  }

  sort() {
    //SORTING
    // console.log(req.query.sort);
    if (this.querySTR.sort) {
      this.query = this.query.sort(this.querySTR.sort);

      const sortBy = this.querySTR.sort.split(',').join(' ');

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    //FIELDS LIMITATION( column in SQL )
    if (this.querySTR.fields) {
      const fields = this.querySTR.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    //PAGINATION
    const page = this.querySTR.page * 1 || 1;
    const limit = this.querySTR.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIfeaturs;
