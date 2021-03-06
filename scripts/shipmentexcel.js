var xlsx = require('node-xlsx');

var Other     = require('../models/other');
var Const = require('../config/const');
var Line = require('../models/line');
var Order = require('../models/order');
var OrderDetail = require('../models/orderdetail');
var Shipment = require('../models/shipment');

var shipmentExcel = function(path, orderid, callback){
  var lines, sizes, orders, orderdetails;

  new Promise((resolve, reject) => {
    Order.getAll(function(err, result){
      if(err){
        callback(err);
      } else {
        orders = result;
        resolve()
      }
    })
  }).then(() => {
    return new Promise((resolve, reject) => {
      OrderDetail.getAll(function(err, result){
        if(err){
          callback(err);
        } else {
          orderdetails = result;
          resolve();
        }
      })
    })
  }).then(() => {
    var exceldata = xlsx.parse(path)[0].data;    
    var fails = [];
    const preprocess = function(data){
      console.log(orderid);
      var tmp = [], order_n = -1, po_n = -1, size_n = 01;      
      for(var i = 0; i < orderdetails.length; i++){        
          if((orderdetails[i].orderid == orderid) && (orderdetails[i].po.toLowerCase() == data[1].toLowerCase())
            && (orderdetails[i].colorname.toLowerCase() == data[3].toLowerCase()) && (orderdetails[i].style.toLowerCase() == data[0].toLowerCase()))
          {
            po_n = i;
            tmp.push(orderid);
            tmp.push(orderdetails[i].id);
            tmp.push(orderdetails[i].color);
            break;
          }
          if(po_n != -1) break;
      }      
      if(po_n == -1){
        tmp = [];
        return tmp;
      }
      tmp.push(data[2]);
      tmp.push(data[4]);
      tmp.push(data[5]);
      tmp.push(data[6]);
      tmp.push(data[7]);
      tmp.push(data[8]);
      tmp.push(data[9]);
      tmp.push(data[10]);
      tmp.push(data[11]);
      tmp.push(data[12]);
      tmp.push(data[13]);
      return tmp;
    }
    const add = function(index){
      var tmp = preprocess(exceldata[index]);
      if(tmp.length == 0){
        fails.push(index);
        if(index < exceldata.length-1){
          add(index + 1);
        }else {
          callback(null, fails);
        }
      }else{
        var myDate = new Date((Number(tmp[3]) - (25567 + 1))*86400*1000);
        var data = {
          po: tmp[1], order: tmp[0], color: tmp[2], date: myDate.getFullYear() + "-" + (myDate.getMonth() + 1 < 10? '0' + (myDate.getMonth() + 1) : myDate.getMonth() + 1 ) + "-" + (myDate.getDate()<10?'0'+(myDate.getDate()): (myDate.getDate())),
          size1: tmp[4], size2: tmp[5], size3: tmp[6], size4: tmp[7], size5: tmp[8], size6: tmp[9], size7: tmp[10], size8: tmp[11], size9: tmp[12], size10: tmp[13]
        };

        Shipment.add(data, function(err, result){
          if(err){
            fails.push(index);
          } else {
            if(index < exceldata.length-1){
              add(index + 1);
            }else {
              callback(null, fails);
            }
          }
        })
      }
    }
    add(2);
  })
}

module.exports = shipmentExcel;