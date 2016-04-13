# Backports from opal 0.10
unless Pathname.method_defined?(:+) && Pathname.method_defined?(:join) && Pathname('.').join('./tree').to_s == 'tree'
  class Pathname
    SEPARATOR_PAT = /#{Regexp.quote File::SEPARATOR}/

    # https://github.com/opal/opal/pull/1430
    def initialize(path)
      if Pathname === path
        @path = path.path.to_s
      elsif path.respond_to?(:to_path)
        @path = path.to_path
      elsif path.is_a?(String)
        @path = path
      elsif path.nil?
        raise TypeError, 'no implicit conversion of nil into String'
      else
        raise TypeError, "no implicit conversion of #{path.class} into String"
      end
      raise ArgumentError if @path == "\0"
    end

    # https://github.com/opal/opal/pull/1430
    def absolute?
      !relative?
    end

    # https://github.com/opal/opal/pull/1430
    def relative?
      path = @path
      while r = chop_basename(path)
        path, = r
      end
      path == ''
    end

    # https://github.com/opal/opal/pull/1430
    def chop_basename(path) # :nodoc:
      base = File.basename(path)
      # ruby uses /^#{SEPARATOR_PAT}?$/o but having issues with interpolation
      if Regexp.new("^#{Pathname::SEPARATOR_PAT.source}?$") =~ base
        return nil
      else
        return path[0, path.rindex(base)], base
      end
    end

    # https://github.com/opal/opal/pull/1430
    def +(other)
      other = Pathname.new(other) unless Pathname === other
      Pathname.new(plus(@path, other.to_s))
    end

    # https://github.com/opal/opal/pull/1430
    def plus(path1, path2) # -> path # :nodoc:
      prefix2 = path2
      index_list2 = []
      basename_list2 = []
      while r2 = chop_basename(prefix2)
        prefix2, basename2 = r2
        index_list2.unshift prefix2.length
        basename_list2.unshift basename2
      end
      return path2 if prefix2 != ''
      prefix1 = path1
      while true
        while !basename_list2.empty? && basename_list2.first == '.'
          index_list2.shift
          basename_list2.shift
        end
        break unless r1 = chop_basename(prefix1)
        prefix1, basename1 = r1
        next if basename1 == '.'
        if basename1 == '..' || basename_list2.empty? || basename_list2.first != '..'
          prefix1 = prefix1 + basename1
          break
        end
        index_list2.shift
        basename_list2.shift
      end
      r1 = chop_basename(prefix1)
      if !r1 && /#{SEPARATOR_PAT}/o =~ File.basename(prefix1)
        while !basename_list2.empty? && basename_list2.first == '..'
          index_list2.shift
          basename_list2.shift
        end
      end
      if !basename_list2.empty?
        suffix2 = path2[index_list2.first..-1]
        r1 ? File.join(prefix1, suffix2) : prefix1 + suffix2
      else
        r1 ? prefix1 : File.dirname(prefix1)
      end
    end

    # https://github.com/opal/opal/pull/1430
    def join(*args)
      return self if args.empty?
      result = args.pop
      result = Pathname.new(result) unless Pathname === result
      return result if result.absolute?
      args.reverse_each {|arg|
        arg = Pathname.new(arg) unless Pathname === arg
        result = arg + result
        return result if result.absolute?
      }
      self + result
    end
  end
end

# Fixed in Opal 0.10
if `Opal.normalize === undefined`
  class Pathname
    def cleanpath
      %x{
        var path = #@path;
        var parts, part, new_parts = [], SEPARATOR = '/';

        if (Opal.current_dir !== '.') {
          path = Opal.current_dir.replace(/\/*$/, '/') + path;
        }

        path = path.replace(/\.(rb|opal|js)$/, '');
        parts = path.split(SEPARATOR);

        for (var i = 0, ii = parts.length; i < ii; i++) {
          part = parts[i];
          if (part === '') continue;
          (part === '..') ? new_parts.pop() : new_parts.push(part)
        }

        return new_parts.join(SEPARATOR);
      }
    end
  end
end