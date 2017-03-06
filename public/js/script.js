'use strict';

var appUrl = window.location.origin;
var socket = io.connect(appUrl);
var chart;
var seriesOptions = [];

$(function() {
   
    $("#add").click(function() {
        var code = $("#stock_code").val();
        if (code !== "") {
            socket.send({ add: code });
            $("#stock_code").val("");
        }
    });
    
    var removeStock = function() {
        var code = $(this).closest(".stock").find(".stock-label").text();
        socket.send({ remove: code });
    };
    
    socket.on("message", function(message) {
        if (message.hasOwnProperty("add")) {
            var dataset = message.add;
            chart.addSeries({
                name: dataset.dataset_code,
                data: dataset.data
            });
            var stockEl = $("#stocks .placeholder").clone();
            stockEl.find(".stock-label").text(dataset.dataset_code);
            stockEl.find(".stock-description").text(dataset.name);
            stockEl.find(".stock-remove").click(removeStock);
            stockEl.removeClass("placeholder").addClass(dataset.dataset_code).appendTo("#stocks");
        } else if (message.hasOwnProperty("remove")) {
            var name = message.remove;
            chart.series.filter(el => el.name === name).map(el => el.remove());
            $(".stock."+name).remove();
        }
    });
    
    function createChart() {
    
        chart = Highcharts.stockChart('chart', {
            rangeSelector: {
                selected: 4
            },
            yAxis: {
                labels: {
                    formatter: function () {
                        return (this.value > 0 ? ' + ' : '') + this.value + '%';
                    }
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },
            plotOptions: {
                series: {
                    compare: 'percent'
                }
            },
            navigator: {
                enabled: false
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
                valueDecimals: 2,
                split: true
            },
            series: seriesOptions
        });
    }
    
    createChart();
    
});