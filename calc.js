// 注意：不能使用"严格模式"，因为我们需要eval()用户的非严格代码

$(document).ready(function () {
  var $ = window.$;

var exampleCalculation =
  "##基础运算 \n" +
  "3^2 \n" +
  "一个鸡蛋1.5元 * 6个鸡蛋 \n" +
  "\n" +
  "##变量和函数\n" +
  "a= -9  \n" +
  "b= 11 \n" +
  "sum(a,b) \n" +
  "mean(a,b) \n" +
  "a > b ? b:a \n" +
  "random() \n" +
  "pi \n" +
  "sin(45) \n" +
  "sqrt(9) \n" +
  "\n" +
  "##单位转换\n" +
  "12 cm to inches \n" +
  "450g to kg \n" +
  "1 day in minutes \n";

  var $inputArea = $("#inputArea"),
    $outputArea = $("#outputArea");

  var binaryOperators = /^[\+\-\*\/]/;

  var previousAnswerLines = []; // 保存旧答案的副本，以查看变化

// 修改过滤表达式函数，保留变量名和运算符。
function filterExpression(expr) {
  return expr.replace(/[^a-zA-Z0-9\s+\-*/%().=&|^!<>?:,\[\]#\.]/g, '');
}

  var calculateAnswers = function () {
    if (!introPlaying) {
      localStorage.setItem("notePadValue", $inputArea.val());
    }

    var lines = $inputArea.val().split("\n");

    var outputLines = [];
    var context = {};

    var previousAnswerIndex;

    // 使用math.evaluate()计算答案
    $.each(lines, function (i, line) {
      try {
            // 检查是否为注释行，以#开头的行
            if (line[0] && line[0] === "#") {
                return;
                }

        if (line.length > 0) {
          // 过滤表达式，保留变量名和数学运算符
          var filteredLine = filterExpression(line);

          // 检查是否有'='符号
          if (filteredLine.includes('=')) {
            // 使用变量的情况
            var parts = filteredLine.split('=');
            var variableName = parts[0].trim();
            var expression = parts[1].trim();
            var answer = math.evaluate(expression, context);
            context[variableName] = answer;
            outputLines[i] = answer;
          } else {
            // 非使用变量的情况
            // 如果行以运算符开始，则在前面加上前一个答案
            if (binaryOperators.test(filteredLine[0]) && outputLines[previousAnswerIndex]) {
              filteredLine = "ans " + filteredLine;
            }

            var answer = math.evaluate(filteredLine, context);

            if (typeof answer === "number" || answer instanceof math.Unit) {
              outputLines[i] = answer;
            }

            context["ans"] = answer;
          }

          previousAnswerIndex = i;
        } else {
          outputLines[i] = null;
        }
      } catch (err) {
        outputLines[i] = null;
      }
    });

    var rows = [];
    $.each(outputLines, function (index, line) {
      var row;
      if (line instanceof math.Unit || typeof line === "number") {
        // 检查是否为整数
        if (Number.isInteger(line)) {
          row = math.format(line, {notation: 'fixed', precision: 0}); // 保留整数
        } else {
          row = math.format(line, {notation: 'fixed', precision: 3}); // 显示三位小数
        }
      } else {
        row = "&nbsp;";
      }

      // 添加"changed"类以高亮显示新的和已更改的答案
      if (
        !previousAnswerLines ||
        previousAnswerLines[index] !== outputLines[index]
      ) {
        row = '<span class="changed">' + row + "</span>";
      }
      rows.push("<li>" + row + "</li>");
    });

    $outputArea.html(rows.join(""));
    previousAnswerLines = outputLines;
  };

  var NUM_ROWS = 20;

  $inputArea.attr("rows", NUM_ROWS);

  // 添加水平标尺线
  var rulerLines = [];
  for (var i = 0; i < NUM_ROWS; i++) {
    rulerLines.push("<li>&nbsp;</li>");
  }
  $(".backgroundRuler").html(rulerLines.join(""));

  $inputArea.bind("input propertychange", calculateAnswers);

  // 从localStorage获取初始计算
  var initialString = localStorage.getItem("notePadValue");
  if (initialString) {
    $inputArea.val(initialString);
    calculateAnswers();
    $inputArea.focus();
  } else {
    // 如果没有初始计算 - 播放介绍示例...
    $inputArea.val("");
    $inputArea.attr("disabled", "disabled");
    initialString = exampleCalculation;
    var introPlaying = true;

    var addCharacter = function (character) {
      $inputArea.val($inputArea.val() + character);
      calculateAnswers();
    };

    var charIndex = 0;
    var charsPerIteration = 4;

    var printInitialLines = function () {
      if (charIndex < initialString.length) {
        var thisCharacter = initialString.slice(
          charIndex,
          charIndex + charsPerIteration
        );
        charIndex += charsPerIteration;

        setTimeout(function () {
          addCharacter(thisCharacter);
          printInitialLines();
        }, 20);
      } else {
        introPlaying = false;
        $inputArea.removeAttr("disabled");
        $inputArea.focus();
      }
    };

    printInitialLines();
  }

  // 为h1标签添加点击事件监听器以清空输入区域
  $('h1').click(function() {
    $inputArea.val('');
    calculateAnswers();
  });

  // 修复复制功能
  $inputArea.on('copy', function (e) {
    e.preventDefault();
    
    var copiedText = '';
    var selection = window.getSelection().toString().split("\n");
    var lines = $inputArea.val().split("\n");
    var outputLines = $outputArea.find('li');

    $.each(selection, function(i, selectedLine) {
      var lineIndex = lines.indexOf(selectedLine);
      if (lineIndex !== -1) {
        var outputValue = $(outputLines[lineIndex]).text().trim();
        if (outputValue && outputValue !== "&nbsp;") {
          copiedText += selectedLine + ' = ' + outputValue + '\n';
        } else {
          copiedText += selectedLine + '\n';
        }
      } else {
        copiedText += selectedLine + '\n';
      }
    });
    
    e.originalEvent.clipboardData.setData('text/plain', copiedText);
  });
});
