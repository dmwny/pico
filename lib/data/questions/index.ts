import type { Question } from './types';

import { printStatementsQuestions as pythonPrintStatementsQuestions } from './python/print-statements';
import { variablesQuestions as pythonVariablesQuestions } from './python/variables';
import { conditionalsQuestions as pythonConditionalsQuestions } from './python/conditionals';
import { forLoopsQuestions as pythonForLoopsQuestions } from './python/for-loops';
import { whileLoopsQuestions as pythonWhileLoopsQuestions } from './python/while-loops';
import { functionsQuestions as pythonFunctionsQuestions } from './python/functions';
import { listsQuestions as pythonListsQuestions } from './python/lists';
import { dictionariesQuestions as pythonDictionariesQuestions } from './python/dictionaries';
import { stringMethodsQuestions as pythonStringMethodsQuestions } from './python/string-methods';
import { userInputQuestions as pythonUserInputQuestions } from './python/user-input';
import { commentsQuestions as pythonCommentsQuestions } from './python/comments';
import { typeConversionQuestions as pythonTypeConversionQuestions } from './python/type-conversion';

import { consoleLogQuestions as javascriptConsoleLogQuestions } from './javascript/console-log';
import { variablesQuestions as javascriptVariablesQuestions } from './javascript/variables';
import { conditionalsQuestions as javascriptConditionalsQuestions } from './javascript/conditionals';
import { forLoopsQuestions as javascriptForLoopsQuestions } from './javascript/for-loops';
import { whileLoopsQuestions as javascriptWhileLoopsQuestions } from './javascript/while-loops';
import { functionsQuestions as javascriptFunctionsQuestions } from './javascript/functions';
import { arraysQuestions as javascriptArraysQuestions } from './javascript/arrays';
import { objectsQuestions as javascriptObjectsQuestions } from './javascript/objects';
import { stringMethodsQuestions as javascriptStringMethodsQuestions } from './javascript/string-methods';

import { consoleLogQuestions as typescriptConsoleLogQuestions } from './typescript/console-log';
import { variablesQuestions as typescriptVariablesQuestions } from './typescript/variables';
import { conditionalsQuestions as typescriptConditionalsQuestions } from './typescript/conditionals';
import { forLoopsQuestions as typescriptForLoopsQuestions } from './typescript/for-loops';
import { whileLoopsQuestions as typescriptWhileLoopsQuestions } from './typescript/while-loops';
import { functionsQuestions as typescriptFunctionsQuestions } from './typescript/functions';
import { arraysQuestions as typescriptArraysQuestions } from './typescript/arrays';
import { objectsQuestions as typescriptObjectsQuestions } from './typescript/objects';
import { stringMethodsQuestions as typescriptStringMethodsQuestions } from './typescript/string-methods';
import { typeAnnotationsQuestions as typescriptTypeAnnotationsQuestions } from './typescript/type-annotations';

import { printStatementsQuestions as javaPrintStatementsQuestions } from './java/print-statements';
import { variablesQuestions as javaVariablesQuestions } from './java/variables';
import { conditionalsQuestions as javaConditionalsQuestions } from './java/conditionals';
import { forLoopsQuestions as javaForLoopsQuestions } from './java/for-loops';
import { whileLoopsQuestions as javaWhileLoopsQuestions } from './java/while-loops';
import { functionsQuestions as javaFunctionsQuestions } from './java/functions';
import { arraysQuestions as javaArraysQuestions } from './java/arrays';
import { stringMethodsQuestions as javaStringMethodsQuestions } from './java/string-methods';
import { typeCastingQuestions as javaTypeCastingQuestions } from './java/type-casting';

import { printStatementsQuestions as csharpPrintStatementsQuestions } from './csharp/print-statements';
import { variablesQuestions as csharpVariablesQuestions } from './csharp/variables';
import { conditionalsQuestions as csharpConditionalsQuestions } from './csharp/conditionals';
import { forLoopsQuestions as csharpForLoopsQuestions } from './csharp/for-loops';
import { whileLoopsQuestions as csharpWhileLoopsQuestions } from './csharp/while-loops';
import { functionsQuestions as csharpFunctionsQuestions } from './csharp/functions';
import { arraysQuestions as csharpArraysQuestions } from './csharp/arrays';
import { stringMethodsQuestions as csharpStringMethodsQuestions } from './csharp/string-methods';
import { typeConversionQuestions as csharpTypeConversionQuestions } from './csharp/type-conversion';

import { printStatementsQuestions as rustPrintStatementsQuestions } from './rust/print-statements';
import { variablesQuestions as rustVariablesQuestions } from './rust/variables';
import { conditionalsQuestions as rustConditionalsQuestions } from './rust/conditionals';
import { forLoopsQuestions as rustForLoopsQuestions } from './rust/for-loops';
import { whileLoopsQuestions as rustWhileLoopsQuestions } from './rust/while-loops';
import { functionsQuestions as rustFunctionsQuestions } from './rust/functions';
import { arraysQuestions as rustArraysQuestions } from './rust/arrays';
import { stringMethodsQuestions as rustStringMethodsQuestions } from './rust/string-methods';
import { ownershipQuestions as rustOwnershipQuestions } from './rust/ownership';

import { printStatementsQuestions as luaPrintStatementsQuestions } from './lua/print-statements';
import { variablesQuestions as luaVariablesQuestions } from './lua/variables';
import { conditionalsQuestions as luaConditionalsQuestions } from './lua/conditionals';
import { forLoopsQuestions as luaForLoopsQuestions } from './lua/for-loops';
import { whileLoopsQuestions as luaWhileLoopsQuestions } from './lua/while-loops';
import { functionsQuestions as luaFunctionsQuestions } from './lua/functions';
import { tablesQuestions as luaTablesQuestions } from './lua/tables';
import { stringMethodsQuestions as luaStringMethodsQuestions } from './lua/string-methods';

export const pythonQuestionBank: Question[] = [
  ...pythonPrintStatementsQuestions,
  ...pythonVariablesQuestions,
  ...pythonConditionalsQuestions,
  ...pythonForLoopsQuestions,
  ...pythonWhileLoopsQuestions,
  ...pythonFunctionsQuestions,
  ...pythonListsQuestions,
  ...pythonDictionariesQuestions,
  ...pythonStringMethodsQuestions,
  ...pythonUserInputQuestions,
  ...pythonCommentsQuestions,
  ...pythonTypeConversionQuestions,
];

export const javascriptQuestionBank: Question[] = [
  ...javascriptConsoleLogQuestions,
  ...javascriptVariablesQuestions,
  ...javascriptConditionalsQuestions,
  ...javascriptForLoopsQuestions,
  ...javascriptWhileLoopsQuestions,
  ...javascriptFunctionsQuestions,
  ...javascriptArraysQuestions,
  ...javascriptObjectsQuestions,
  ...javascriptStringMethodsQuestions,
];

export const typescriptQuestionBank: Question[] = [
  ...typescriptConsoleLogQuestions,
  ...typescriptVariablesQuestions,
  ...typescriptConditionalsQuestions,
  ...typescriptForLoopsQuestions,
  ...typescriptWhileLoopsQuestions,
  ...typescriptFunctionsQuestions,
  ...typescriptArraysQuestions,
  ...typescriptObjectsQuestions,
  ...typescriptStringMethodsQuestions,
  ...typescriptTypeAnnotationsQuestions,
];

export const javaQuestionBank: Question[] = [
  ...javaPrintStatementsQuestions,
  ...javaVariablesQuestions,
  ...javaConditionalsQuestions,
  ...javaForLoopsQuestions,
  ...javaWhileLoopsQuestions,
  ...javaFunctionsQuestions,
  ...javaArraysQuestions,
  ...javaStringMethodsQuestions,
  ...javaTypeCastingQuestions,
];

export const csharpQuestionBank: Question[] = [
  ...csharpPrintStatementsQuestions,
  ...csharpVariablesQuestions,
  ...csharpConditionalsQuestions,
  ...csharpForLoopsQuestions,
  ...csharpWhileLoopsQuestions,
  ...csharpFunctionsQuestions,
  ...csharpArraysQuestions,
  ...csharpStringMethodsQuestions,
  ...csharpTypeConversionQuestions,
];

export const rustQuestionBank: Question[] = [
  ...rustPrintStatementsQuestions,
  ...rustVariablesQuestions,
  ...rustConditionalsQuestions,
  ...rustForLoopsQuestions,
  ...rustWhileLoopsQuestions,
  ...rustFunctionsQuestions,
  ...rustArraysQuestions,
  ...rustStringMethodsQuestions,
  ...rustOwnershipQuestions,
];

export const luaQuestionBank: Question[] = [
  ...luaPrintStatementsQuestions,
  ...luaVariablesQuestions,
  ...luaConditionalsQuestions,
  ...luaForLoopsQuestions,
  ...luaWhileLoopsQuestions,
  ...luaFunctionsQuestions,
  ...luaTablesQuestions,
  ...luaStringMethodsQuestions,
];

export const questionBank: Question[] = [
  ...pythonQuestionBank,
  ...javascriptQuestionBank,
  ...typescriptQuestionBank,
  ...javaQuestionBank,
  ...csharpQuestionBank,
  ...rustQuestionBank,
  ...luaQuestionBank,
];
