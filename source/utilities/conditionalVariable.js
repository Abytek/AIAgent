
function makeConditionalVariable()
{
    const result = {
        resolveFunction: null,
        rejectFunction: null,
    }
    result.bind = function(resolveFunction, rejectFunction)
    {
        result.resolveFunction = resolveFunction;
        result.rejectFunction = rejectFunction;
        return result;
    }
    result.wait = function(callback)
    {
        return new Promise(
            (resolve, reject) => {
                result.bind(resolve, reject);
                if (callback)
                {
                    callback();
                }
            }
        );
    }
    result.resolve = function(value, duration = 16)
    {
        if (result.resolveFunction)
        {
            result.resolveFunction(value);
        }
        else
        {
            setTimeout(
                () => result.resolve(value),
                duration
            )
        }
    }
    result.reject = function(err, duration = 16)
    {
        if (result.rejectFunction)
        {
            result.rejectFunction(err);
        }
        else
        {
            setTimeout(
                () => result.reject(err),
                duration
            )
        }
    }
    return result;
}

module.exports = {
    makeConditionalVariable
}